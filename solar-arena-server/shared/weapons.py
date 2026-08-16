"""Определения всех видов оружия."""
from dataclasses import dataclass


@dataclass
class WeaponDef:
    name: str
    damage: float
    fire_rate: float
    projectile_speed: float
    range_: float
    spread: float
    ammo_cost: int


WEAPONS: dict[str, WeaponDef] = {
    "laser_rifle": WeaponDef(
        name="Laser Rifle",
        damage=15,
        fire_rate=3,
        projectile_speed=800,
        range_=400,
        spread=0.02,
        ammo_cost=1,
    ),
    "plasma_cannon": WeaponDef(
        name="Plasma Cannon",
        damage=40,
        fire_rate=0.8,
        projectile_speed=500,
        range_=500,
        spread=0.05,
        ammo_cost=3,
    ),
    "mining_drill": WeaponDef(
        name="Mining Drill",
        damage=5,
        fire_rate=10,
        projectile_speed=0,
        range_=30,
        spread=0,
        ammo_cost=0,
    ),
}
