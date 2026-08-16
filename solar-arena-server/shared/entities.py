"""Все игровые сущности как dataclass."""
from dataclasses import dataclass, field
from typing import Optional


@dataclass
class Entity:
    id: int
    x: float
    y: float
    vx: float = 0.0
    vy: float = 0.0
    radius: float = 8.0
    hp: float = 100.0
    max_hp: float = 100.0
    entity_type: str = "entity"
    alive: bool = True
    dirty: bool = True

    def to_dict(self) -> dict:
        return {
            "id": self.id,
            "x": round(self.x, 1),
            "y": round(self.y, 1),
            "vx": round(self.vx, 1),
            "vy": round(self.vy, 1),
            "hp": round(self.hp),
            "type": self.entity_type,
        }


@dataclass
class Planet(Entity):
    name: str = ""
    resources: dict = field(default_factory=dict)
    regen_rate: dict = field(default_factory=dict)
    owner_faction: Optional[str] = None
    entity_type: str = "planet"

    def to_dict(self) -> dict:
        d = super().to_dict()
        d.update({
            "name": self.name,
            "radius": self.radius,
            "resources": self.resources,
        })
        return d


@dataclass
class Player(Entity):
    name: str = ""
    faction: str = "Earth"
    current_weapon: str = "laser_rifle"
    angle: float = 0.0
    resources_held: dict = field(default_factory=dict)
    respawn_timer: float = 0.0
    entity_type: str = "player"
    current_planet: str = "Earth"

    def to_dict(self) -> dict:
        d = super().to_dict()
        d.update({
            "name": self.name,
            "faction": self.faction,
            "weapon": self.current_weapon,
            "angle": round(self.angle, 2),
            "planet": self.current_planet,
        })
        return d


@dataclass
class AIBot(Player):
    behavior_state: str = "gather"
    target_id: Optional[int] = None
    home_planet_id: int = 0
    entity_type: str = "ai_bot"

    def to_dict(self) -> dict:
        d = super().to_dict()
        d["behavior"] = self.behavior_state
        return d


@dataclass
class Projectile(Entity):
    owner_id: int = 0
    damage: float = 15.0
    lifetime: float = 1.5
    weapon_type: str = "laser_rifle"
    entity_type: str = "projectile"

    def to_dict(self) -> dict:
        d = super().to_dict()
        d["owner"] = self.owner_id
        return d
