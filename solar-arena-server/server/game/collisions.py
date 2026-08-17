"""Spatial hashing для эффективного поиска коллизий."""
from collections import defaultdict
from server.game.world import World
from shared.constants import CHUNK_SIZE


class CollisionSystem:

    def _get_space_name(self, world, entity) -> str | None:
        if entity.entity_type == "planet":
            return entity.name

        if entity.entity_type == "projectile":
            owner = world.get_entity(entity.owner_id)

            if owner:
                return getattr(
                    owner,
                    "current_planet",
                    None,
                )

            return None

        return getattr(
            entity,
            "current_planet",
            None,
        )

    def __init__(self, chunk_size: int = CHUNK_SIZE):
        self.chunk_size = chunk_size
        self.grid: dict[tuple[int, int], list[int]] = defaultdict(list)

    def rebuild(self, world: World) -> None:
        self.grid.clear()
        for entity in world.entities.values():
            if not entity.alive:
                continue
            cx = int(entity.x // self.chunk_size)
            cy = int(entity.y // self.chunk_size)
            self.grid[(cx, cy)].append(entity.id)

    def resolve(self, world: World) -> None:
        checked: set[tuple[int, int]] = set()

        for (cx, cy), ids in self.grid.items():
            for dx in (-1, 0, 1):
                for dy in (-1, 0, 1):
                    neighbor = (cx + dx, cy + dy)
                    if neighbor not in self.grid:
                        continue
                    for id1 in ids:
                        for id2 in self.grid[neighbor]:
                            if id1 >= id2:
                                continue
                            pair = (id1, id2)
                            if pair in checked:
                                continue
                            checked.add(pair)
                            self._check_pair(world, id1, id2)

    def query_nearby(self, world: World, x: float, y: float,
                     radius: float) -> list:
        results = []
        cx = int(x // self.chunk_size)
        cy = int(y // self.chunk_size)
        chunk_r = int(radius // self.chunk_size) + 1
        for dx in range(-chunk_r, chunk_r + 1):
            for dy in range(-chunk_r, chunk_r + 1):
                for eid in self.grid.get((cx + dx, cy + dy), []):
                    e = world.get_entity(eid)
                    if e and e.alive:
                        results.append(e)
        return results

    def _check_pair(self, world: World, id1: int, id2: int) -> None:
        e1 = world.get_entity(id1)
        e2 = world.get_entity(id2)

        if not e1 or not e2:
            return

        dx = e2.x - e1.x
        dy = e2.y - e1.y
        dist_sq = dx * dx + dy * dy
        min_dist = e1.radius + e2.radius

        if dist_sq < min_dist * min_dist and dist_sq > 0:
            dist = dist_sq ** 0.5
            overlap = min_dist - dist
            nx = dx / dist
            ny = dy / dist

            if e1.entity_type != "projectile" and e2.entity_type != "projectile":
                push = overlap * 0.5
                e1.x -= nx * push
                e1.y -= ny * push
                e2.x += nx * push
                e2.y += ny * push
                e1.dirty = e2.dirty = True

            if e1.entity_type == "projectile" and e2.entity_type in ("player", "ai_bot"):
                self._apply_damage(e1, e2)
            elif e2.entity_type == "projectile" and e1.entity_type in ("player", "ai_bot"):
                self._apply_damage(e2, e1)

    def _apply_damage(self, projectile, target) -> None:
        target.hp -= projectile.damage
        target.dirty = True
        projectile.alive = False
        if target.hp <= 0:
            target.alive = False
