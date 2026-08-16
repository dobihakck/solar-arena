"""WebSocket-сервер + игровой цикл."""
import asyncio
import json
import time
import websockets
from server.network.session import SessionManager
from server.game.world import World
from server.game.physics import PhysicsSystem
from server.game.collisions import CollisionSystem
from server.game.combat import CombatSystem
from server.game.resources import ResourceSystem
from server.game.ai.controller import AIController
from shared.constants import TICK_RATE, TICK_DURATION


class GameServer:
    def __init__(self, host: str = "0.0.0.0", port: int = 8765):
        self.host = host
        self.port = port

        self.world = World()
        self.physics = PhysicsSystem()
        self.collisions = CollisionSystem()
        self.combat = CombatSystem()
        self.resources = ResourceSystem()
        self.ai = AIController()

        self.sessions = SessionManager()
        self.new_destroyed_tiles: list[dict] = []
        self.all_destroyed_tiles: list[dict] = []
        self._running = False

    async def start(self) -> None:
        self._running = True
        self.world.create_solar_system()

        for bot_id in self.world.bots:
            self.ai.register_bot(bot_id)

        print(f"Мир создан: {len(self.world.planets)} планет, "
              f"{len(self.world.bots)} ботов")

        await asyncio.gather(
            self._game_loop(),
            self._ws_server(),
        )

    async def _ws_server(self) -> None:
        async with websockets.serve(
            self._handle_connection,
            self.host,
            self.port,
            max_size=65536,
            ping_interval=20,
            ping_timeout=10,
        ):
            print(f"Сервер запущен: ws://{self.host}:{self.port}")
            await asyncio.Future()

    async def _handle_connection(self, ws) -> None:
        session = self.sessions.create(ws)
        print(f"Игрок подключился: id={session.player_id}")

        try:
            async for raw in ws:
                msg = json.loads(raw)
                await self._handle_message(session, msg)
        except websockets.ConnectionClosed:
            pass
        finally:
            print(f"Игрок отключился: id={session.player_id}")
            player = self.world.players.get(session.player_id)
            if player:
                player.alive = False
                player.dirty = True
            self.sessions.remove(session)

    async def _handle_message(self, session, msg: dict) -> None:
        mtype = msg.get("type")

        if mtype == "login":
            data = msg.get("data", {})
            session.player_name = data.get("name", f"Player{session.player_id}")
            faction = data.get("faction", "Earth")
            planet_name = data.get("planet", faction)

            player = self.world.spawn_player(
                session.player_id, session.player_name, planet_name
            )
            snapshot = self.world.get_snapshot()
            snapshot["my_entity_id"] = session.player_id
            snapshot["destroyed_tiles"] = self.all_destroyed_tiles
            await session.send({"type": "world_snapshot", "data": snapshot})

        elif mtype == "player_input":
            self._process_input(session.player_id, msg.get("data", {}))

        elif mtype == "player_position":
            self._update_player_position(session.player_id, msg.get("data", {}))

        elif mtype == "mine_tile":
            self._process_mining(session.player_id, msg.get("data", {}))

        elif mtype == "remove_projectile":
            proj_id = msg.get("data", {}).get("id")
            if proj_id:
                entity = self.world.get_entity(proj_id)
                if entity and entity.entity_type == "projectile":
                    entity.alive = False
                    entity.dirty = True

        elif mtype == "ping":
            await session.send({
                "type": "pong",
                "data": {"tick": self.world.tick}
            })

    def _process_input(self, player_id: int, data: dict) -> None:
        player = self.world.players.get(player_id)
        if not player or not player.alive:
            return

        if data.get("shoot"):
            angle = data.get("angle", 0)
            self.combat.fire(self.world, player, angle)

        if data.get("weapon"):
            player.current_weapon = data["weapon"]
            player.dirty = True

    def _update_player_position(self, player_id: int, data: dict) -> None:
        player = self.world.players.get(player_id)
        if not player or not player.alive:
            return
        player.x = data.get("x", player.x)
        player.y = data.get("y", player.y)
        player.vx = data.get("vx", 0)
        player.vy = data.get("vy", 0)
        player.angle = data.get("angle", 0)
        player.current_weapon = data.get("weapon", player.current_weapon)
        player.current_planet = data.get("planet", player.current_planet)
        player.dirty = True

    def _process_mining(self, player_id: int, data: dict) -> None:
        player = self.world.players.get(player_id)
        if not player:
            return

        resource = data.get("resource")
        tile_x = data.get("x")
        tile_y = data.get("y")

        if resource:
            player.resources_held[resource] = \
                player.resources_held.get(resource, 0) + 1
            player.dirty = True

        if tile_x is not None and tile_y is not None:
            tile_data = {"x": tile_x, "y": tile_y}
            self.new_destroyed_tiles.append(tile_data)
            self.all_destroyed_tiles.append(tile_data)

    async def _game_loop(self) -> None:
        next_tick = time.monotonic()

        while self._running:
            self._simulate_tick()
            await self._broadcast_updates()

            next_tick += TICK_DURATION
            sleep_time = next_tick - time.monotonic()
            if sleep_time > 0:
                await asyncio.sleep(sleep_time)
            else:
                next_tick = time.monotonic()

    def _simulate_tick(self) -> None:
        self.world.tick += 1
        dt = TICK_DURATION

        self.physics.update(self.world, dt)
        self.collisions.rebuild(self.world)
        self.collisions.resolve(self.world)
        self.combat.update(self.world, dt)
        resource_events = self.resources.update(self.world, dt)

        if self.world.tick % 3 == 0:
            self.ai.update(self.world, dt * 3)

        despawns = self.world.cleanup_dead()

        self._tick_despawns = despawns
        self._tick_resource_events = resource_events

    async def _broadcast_updates(self) -> None:
        updates_by_planet: dict[str, list[dict]] = {}
        for entity in self.world.entities.values():
            if entity.dirty:
                entity_dict = entity.to_dict()
                planet_name = None
                if entity.entity_type in ("player", "ai_bot"):
                    planet_name = getattr(entity, "current_planet", None)
                elif entity.entity_type == "projectile":
                    owner = self.world.get_entity(entity.owner_id)
                    planet_name = getattr(owner, "current_planet", None) if owner else None

                if planet_name:
                    if planet_name not in updates_by_planet:
                        updates_by_planet[planet_name] = []
                    updates_by_planet[planet_name].append(entity_dict)
                entity.dirty = False

        despawns = getattr(self, "_tick_despawns", [])
        events = getattr(self, "_tick_resource_events", [])
        tiles = self.new_destroyed_tiles
        self.new_destroyed_tiles = []

        for session_id, session in self.sessions.sessions.items():
            player = self.world.players.get(session_id)
            if not player:
                continue

            player_planet = player.current_planet
            planet_updates = updates_by_planet.get(player_planet, [])

            if planet_updates or despawns or events or tiles:
                await session.send({
                    "type": "world_update",
                    "data": {
                        "tick": self.world.tick,
                        "updates": planet_updates,
                        "despawns": despawns,
                        "events": events,
                        "tiles_destroyed": tiles
                    }
                })
