"""Физика — движение сущностей."""
from server.game.world import World


class PhysicsSystem:

    def update(self, world: World, dt: float) -> None:
        for entity in world.entities.values():
            if not entity.alive:
                continue
            entity.x += entity.vx * dt
            entity.y += entity.vy * dt
            entity.vx *= 0.98
            entity.vy *= 0.98

            if entity.entity_type == "projectile":
                entity.lifetime -= dt
                if entity.lifetime <= 0:
                    entity.alive = False

            entity.dirty = True
