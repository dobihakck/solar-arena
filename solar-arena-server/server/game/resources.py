"""Система ресурсов — добыча, регенерация, истощение."""
import math
from server.game.world import World
from shared.constants import RESOURCE_EXTRACTION_RATE


class ResourceSystem:

    def update(self, world: World, dt: float) -> list[dict]:
        events = []

        for planet in world.planets.values():
            for resource, amount in planet.resources.items():
                regen = planet.regen_rate.get(resource, 0)
                planet.resources[resource] = amount + regen * dt
                planet.dirty = True

        for entity in world.entities.values():
            if entity.entity_type not in ("player", "ai_bot") or not entity.alive:
                continue

            planet = self._find_nearby_planet(world, entity)
            if not planet:
                continue

            for resource, amount in planet.resources.items():
                if amount > 0:
                    extracted = min(RESOURCE_EXTRACTION_RATE * dt, amount)
                    planet.resources[resource] = amount - extracted
                    entity.resources_held[resource] = \
                        entity.resources_held.get(resource, 0) + extracted
                    planet.dirty = entity.dirty = True
                    events.append({
                        "type": "resource_extracted",
                        "entity_id": entity.id,
                        "planet_id": planet.id,
                        "resource": resource,
                        "amount": round(extracted, 1),
                    })
                    break

        return events

    def _find_nearby_planet(self, world: World, entity) -> "Planet | None":
        for planet in world.planets.values():
            dist = math.hypot(entity.x - planet.x, entity.y - planet.y)
            if dist < planet.radius + entity.radius + 20:
                return planet
        return None
