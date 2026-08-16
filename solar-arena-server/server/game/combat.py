"""Боевая система — стрельба, снаряды, урон."""
import math
import random
from server.game.world import World
from shared.entities import Projectile
from shared.weapons import WEAPONS
from shared.constants import PROJECTILE_LIFETIME, PROJECTILE_RADIUS


class CombatSystem:

    def fire(self, world: World, shooter, angle: float) -> Projectile | None:
        weapon = WEAPONS.get(shooter.current_weapon)
        if not weapon:
            return None

        spread = random.uniform(-weapon.spread, weapon.spread)
        angle += spread

        proj_id = world.generate_id()
        proj = Projectile(
            id=proj_id,
            x=shooter.x + math.cos(angle) * (shooter.radius + 5),
            y=shooter.y + math.sin(angle) * (shooter.radius + 5),
            vx=math.cos(angle) * weapon.projectile_speed,
            vy=math.sin(angle) * weapon.projectile_speed,
            radius=PROJECTILE_RADIUS,
            owner_id=shooter.id,
            damage=weapon.damage,
            lifetime=PROJECTILE_LIFETIME,
            weapon_type=shooter.current_weapon,
        )
        world.add_projectile(proj)
        return proj

    def update(self, world: World, dt: float) -> list[dict]:
        events = []
        return events
