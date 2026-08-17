"""Игровой мир — все сущности, планеты, состояние."""

TILE_SIZE = 28

PLANET_GEOMETRY = {
    "Mercury": {
        "world_width": 200,
        "surface_level": 25,
    },
    "Venus": {
        "world_width": 220,
        "surface_level": 25,
    },
    "Earth": {
        "world_width": 250,
        "surface_level": 25,
    },
    "Mars": {
        "world_width": 200,
        "surface_level": 25,
    },
    "Jupiter": {
        "world_width": 180,
        "surface_level": 20,
    },
    "Saturn": {
        "world_width": 180,
        "surface_level": 20,
    },
}

import random
from shared.entities import Entity, Planet, Player, AIBot, Projectile
from shared.constants import (
    BOTS_PER_PLANET, PLAYER_SPAWN_HP, PLAYER_RADIUS,
    BOT_RADIUS,
)


class World:
    def __init__(self):
        self.entities: dict[int, Entity] = {}
        self.planets: dict[int, Planet] = {}
        self.players: dict[int, Player] = {}
        self.bots: dict[int, AIBot] = {}
        self.projectiles: list[Projectile] = []
        self.tick: int = 0
        self._next_id: int = 0

    def generate_id(self) -> int:
        self._next_id += 1
        return self._next_id

    def add_entity(self, entity: Entity) -> None:
        self.entities[entity.id] = entity
        entity.dirty = True

    def remove_entity(self, entity_id: int) -> None:
        self.entities.pop(entity_id, None)
        self.players.pop(entity_id, None)
        self.bots.pop(entity_id, None)

    def get_entity(self, entity_id: int) -> Entity | None:
        return self.entities.get(entity_id)

    def create_solar_system(self) -> None:
        planet_data = [
            ("Mercury",    0,     0, 25, {"iron": 8000, "water": 0}),
            ("Venus",    350,   -80, 35, {"iron": 5000, "water": 1000}),
            ("Earth",    700,    60, 40, {"iron": 6000, "water": 8000, "oxygen": 4000}),
            ("Mars",    1100,  -120, 30, {"iron": 3000, "water": 500}),
            ("Jupiter", 1800,   100, 60, {"iron": 10000, "gas": 12000}),
            ("Saturn",  2500,  -200, 55, {"iron": 4000, "gas": 15000}),
        ]

        for name, x, y, radius, resources in planet_data:
            pid = self.generate_id()
            geometry = PLANET_GEOMETRY[name]

            local_world_width = geometry["world_width"] * TILE_SIZE
            local_surface_y = geometry["surface_level"] * TILE_SIZE

            planet = Planet(
                id=pid,

                # Центр локальной карты планеты
                x=local_world_width / 2,

                # Уровень поверхности локальной карты
                y=local_surface_y,

                radius=radius,
                name=name,
                resources=dict(resources),
                regen_rate={
                    key: value * 0.1
                    for key, value in resources.items()
                },
                owner_faction=name,
            )
            self.planets[pid] = planet
            self.add_entity(planet)

            for _ in range(BOTS_PER_PLANET):
                self._spawn_bot(planet)

    def _spawn_bot(self, planet: Planet) -> AIBot:
        bot_id = self.generate_id()

        bot = AIBot(
            id=bot_id,

        # Боты появляются около центра локальной карты
        x=planet.x + random.uniform(-160, 160),

        # Немного выше поверхности
        y=planet.y - BOT_RADIUS - 4,

        name=f"Bot-{bot_id}",
        faction=planet.name,
        current_planet=planet.name,

        radius=BOT_RADIUS,
        hp=PLAYER_SPAWN_HP,
        max_hp=PLAYER_SPAWN_HP,

        home_planet_id=planet.id,
        behavior_state="gather",
    )

        self.bots[bot_id] = bot
        self.add_entity(bot)
        return bot

    def spawn_player(
        self,
        player_id: int,
        name: str,
        faction: str,
    ) -> Player:
        planet = self._find_spawn_planet(faction)

        player = Player(
            id=player_id,

            x=planet.x + random.uniform(-80, 80),
            y=planet.y - PLAYER_RADIUS - 4,

            name=name,
            faction=faction,
            current_planet=planet.name,

            radius=PLAYER_RADIUS,
            hp=PLAYER_SPAWN_HP,
            max_hp=PLAYER_SPAWN_HP,
            current_weapon="laser_rifle",
        )

        self.players[player_id] = player
        self.add_entity(player)
        return player

    def _find_spawn_planet(self, faction: str) -> Planet:
        for planet in self.planets.values():
            if planet.name == faction:
                return planet
        for planet in self.planets.values():
            if planet.name == "Earth":
                return planet
        return next(iter(self.planets.values()))

    def add_projectile(self, proj: Projectile) -> None:
        self.projectiles.append(proj)
        self.add_entity(proj)

    def get_snapshot(self) -> dict:
        return {
            "tick": self.world.tick if hasattr(self, 'world') else self.tick,
            "planets": [p.to_dict() for p in self.planets.values()],
            "entities": [e.to_dict() for e in self.entities.values()],
        }

    def cleanup_dead(self) -> list[int]:
        despawns = []
        for eid, entity in list(self.entities.items()):
            if not entity.alive:
                self.remove_entity(eid)
                despawns.append(eid)
        self.projectiles = [p for p in self.projectiles if p.alive]
        return despawns
