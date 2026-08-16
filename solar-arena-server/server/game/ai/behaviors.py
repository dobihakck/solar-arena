"""Деревья поведения для ботов."""
import math
from enum import Enum
from server.game.world import World
from shared.constants import BOT_SPEED
from server.game.combat import CombatSystem


class NodeState(Enum):
    SUCCESS = 1
    FAILURE = 2
    RUNNING = 3


class BehaviorNode:
    def tick(self, world: World, bot, dt: float) -> NodeState:
        raise NotImplementedError


class Selector(BehaviorNode):
    def __init__(self, children: list[BehaviorNode]):
        self.children = children

    def tick(self, world, bot, dt):
        for child in self.children:
            result = child.tick(world, bot, dt)
            if result != NodeState.FAILURE:
                return result
        return NodeState.FAILURE


class Sequence(BehaviorNode):
    def __init__(self, children: list[BehaviorNode]):
        self.children = children

    def tick(self, world, bot, dt):
        for child in self.children:
            result = child.tick(world, bot, dt)
            if result != NodeState.SUCCESS:
                return result
        return NodeState.SUCCESS


class AttackNearbyEnemy(BehaviorNode):
    def tick(self, world, bot, dt):
        enemy = self._find_nearest_enemy(world, bot)
        if not enemy:
            return NodeState.FAILURE

        dist = math.hypot(enemy.x - bot.x, enemy.y - bot.y)

        if dist < 300:
            angle = math.atan2(enemy.y - bot.y, enemy.x - bot.x)
            combat = CombatSystem()
            combat.fire(world, bot, angle)
            return NodeState.SUCCESS
        else:
            dx = enemy.x - bot.x
            dy = enemy.y - bot.y
            d = math.hypot(dx, dy)
            if d > 0:
                bot.vx = (dx / d) * BOT_SPEED
                bot.vy = (dy / d) * BOT_SPEED
                bot.dirty = True
            return NodeState.RUNNING

    def _find_nearest_enemy(self, world, bot):
        nearest = None
        min_dist = float("inf")
        for entity in world.entities.values():
            if entity.id == bot.id or not entity.alive:
                continue
            if entity.entity_type not in ("player", "ai_bot"):
                continue
            if hasattr(entity, "faction") and entity.faction == bot.faction:
                continue
            dist = math.hypot(entity.x - bot.x, entity.y - bot.y)
            if dist < min_dist:
                min_dist = dist
                nearest = entity
        return nearest


class GatherResources(BehaviorNode):
    def tick(self, world, bot, dt):
        planet = self._find_nearest_planet_with_resources(world, bot)
        if not planet:
            return NodeState.FAILURE

        dist = math.hypot(planet.x - bot.x, planet.y - bot.y)

        if dist < planet.radius + 20:
            bot.vx = 0
            bot.vy = 0
            bot.dirty = True
            return NodeState.SUCCESS
        else:
            dx = planet.x - bot.x
            dy = planet.y - bot.y
            d = math.hypot(dx, dy)
            if d > 0:
                bot.vx = (dx / d) * BOT_SPEED
                bot.vy = (dy / d) * BOT_SPEED
                bot.dirty = True
            return NodeState.RUNNING

    def _find_nearest_planet_with_resources(self, world, bot):
        nearest = None
        min_dist = float("inf")
        for planet in world.planets.values():
            if not any(v > 0 for v in planet.resources.values()):
                continue
            dist = math.hypot(planet.x - bot.x, planet.y - bot.y)
            if dist < min_dist:
                min_dist = dist
                nearest = planet
        return nearest


class DefendHome(BehaviorNode):
    def tick(self, world, bot, dt):
        planet = world.planets.get(bot.home_planet_id)
        if not planet:
            return NodeState.FAILURE

        dist = math.hypot(planet.x - bot.x, planet.y - bot.y)
        if dist > planet.radius + 100:
            dx = planet.x - bot.x
            dy = planet.y - bot.y
            d = math.hypot(dx, dy)
            if d > 0:
                bot.vx = (dx / d) * BOT_SPEED
                bot.vy = (dy / d) * BOT_SPEED
                bot.dirty = True
            return NodeState.RUNNING

        return NodeState.SUCCESS


class BehaviorTree:
    def __init__(self):
        self.root = Selector([
            Sequence([
                DefendHome(),
                AttackNearbyEnemy(),
            ]),
            GatherResources(),
            AttackNearbyEnemy(),
        ])

    def tick(self, world: World, bot, dt: float) -> None:
        self.root.tick(world, bot, dt)
