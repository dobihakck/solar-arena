"""Поведение ИИ-ботов."""

import math
from enum import Enum

from server.game.world import World
from server.game.combat import CombatSystem
from shared.constants import BOT_SPEED


class NodeState(Enum):
    SUCCESS = 1
    FAILURE = 2
    RUNNING = 3


class BehaviorNode:
    def tick(
        self,
        world: World,
        bot,
        dt: float,
    ) -> NodeState:
        raise NotImplementedError


class Selector(BehaviorNode):
    """Выполняет дочерние узлы, пока один не вернёт SUCCESS или RUNNING."""

    def __init__(self, children: list[BehaviorNode]):
        self.children = children

    def tick(
        self,
        world: World,
        bot,
        dt: float,
    ) -> NodeState:
        for child in self.children:
            result = child.tick(world, bot, dt)

            if result != NodeState.FAILURE:
                return result

        return NodeState.FAILURE


class Sequence(BehaviorNode):
    """Выполняет дочерние узлы последовательно."""

    def __init__(self, children: list[BehaviorNode]):
        self.children = children

    def tick(
        self,
        world: World,
        bot,
        dt: float,
    ) -> NodeState:
        for child in self.children:
            result = child.tick(world, bot, dt)

            if result != NodeState.SUCCESS:
                return result

        return NodeState.SUCCESS


class AttackNearbyEnemy(BehaviorNode):
    """Ищет врага на текущей планете и атакует его."""

    def __init__(self):
        self.combat = CombatSystem()

    def tick(
        self,
        world: World,
        bot,
        dt: float,
    ) -> NodeState:
        enemy = self._find_nearest_enemy(world, bot)

        if enemy is None:
            return NodeState.FAILURE

        distance = math.hypot(
            enemy.x - bot.x,
            enemy.y - bot.y,
        )

        if distance <= 300:
            angle = math.atan2(
                enemy.y - bot.y,
                enemy.x - bot.x,
            )

            self.combat.fire(
                world,
                bot,
                angle,
            )

            bot.vx = 0
            bot.vy = 0
            bot.behavior_state = "attack"
            bot.dirty = True

            return NodeState.SUCCESS

        direction_x = enemy.x - bot.x
        direction_y = enemy.y - bot.y

        direction_length = math.hypot(
            direction_x,
            direction_y,
        )

        if direction_length > 0:
            bot.vx = (
                direction_x / direction_length
            ) * BOT_SPEED

            bot.vy = (
                direction_y / direction_length
            ) * BOT_SPEED

            bot.behavior_state = "attack"
            bot.dirty = True

        return NodeState.RUNNING

    def _find_nearest_enemy(
        self,
        world: World,
        bot,
    ):
        nearest_enemy = None
        nearest_distance = float("inf")

        bot_planet = getattr(
            bot,
            "current_planet",
            None,
        )

        for entity in world.entities.values():
            if entity.id == bot.id:
                continue

            if not entity.alive:
                continue

            if entity.entity_type not in (
                "player",
                "ai_bot",
            ):
                continue

            entity_planet = getattr(
                entity,
                "current_planet",
                None,
            )

            # Игнорируем сущности с других планет.
            if bot_planet and entity_planet:
                if bot_planet != entity_planet:
                    continue

            # Союзников не атакуем.
            if (
                hasattr(entity, "faction")
                and entity.faction == bot.faction
            ):
                continue

            distance = math.hypot(
                entity.x - bot.x,
                entity.y - bot.y,
            )

            if distance < nearest_distance:
                nearest_distance = distance
                nearest_enemy = entity

        return nearest_enemy


class GatherResources(BehaviorNode):
    """Ищет ресурсы на текущей планете."""

    def tick(
        self,
        world: World,
        bot,
        dt: float,
    ) -> NodeState:
        planet = (
            self._find_nearest_planet_with_resources(
                world,
                bot,
            )
        )

        if planet is None:
            return NodeState.FAILURE

        distance = math.hypot(
            planet.x - bot.x,
            planet.y - bot.y,
        )

        if distance <= planet.radius + 20:
            bot.vx = 0
            bot.vy = 0
            bot.behavior_state = "gather"
            bot.dirty = True

            return NodeState.SUCCESS

        direction_x = planet.x - bot.x
        direction_y = planet.y - bot.y

        direction_length = math.hypot(
            direction_x,
            direction_y,
        )

        if direction_length > 0:
            bot.vx = (
                direction_x / direction_length
            ) * BOT_SPEED

            bot.vy = (
                direction_y / direction_length
            ) * BOT_SPEED

            bot.behavior_state = "gather"
            bot.dirty = True

        return NodeState.RUNNING

    def _find_nearest_planet_with_resources(
        self,
        world: World,
        bot,
    ):
        nearest_planet = None
        nearest_distance = float("inf")

        bot_planet = getattr(
            bot,
            "current_planet",
            None,
        )

        for planet in world.planets.values():
            # Бот работает только на своей планете.
            if bot_planet and planet.name != bot_planet:
                continue

            has_resources = any(
                amount > 0
                for amount in planet.resources.values()
            )

            if not has_resources:
                continue

            distance = math.hypot(
                planet.x - bot.x,
                planet.y - bot.y,
            )

            if distance < nearest_distance:
                nearest_distance = distance
                nearest_planet = planet

        return nearest_planet


class DefendHome(BehaviorNode):
    """Возвращает бота к домашней планете."""

    def tick(
        self,
        world: World,
        bot,
        dt: float,
    ) -> NodeState:
        home_planet = world.planets.get(
            bot.home_planet_id,
        )

        if home_planet is None:
            return NodeState.FAILURE

        distance = math.hypot(
            home_planet.x - bot.x,
            home_planet.y - bot.y,
        )

        if distance <= home_planet.radius + 100:
            return NodeState.SUCCESS

        direction_x = home_planet.x - bot.x
        direction_y = home_planet.y - bot.y

        direction_length = math.hypot(
            direction_x,
            direction_y,
        )

        if direction_length > 0:
            bot.vx = (
                direction_x / direction_length
            ) * BOT_SPEED

            bot.vy = (
                direction_y / direction_length
            ) * BOT_SPEED

            bot.behavior_state = "defend"
            bot.dirty = True

        return NodeState.RUNNING


class BehaviorTree:
    """Основное дерево поведения бота."""

    def __init__(self):
        self.root = Selector(
            [
                Sequence(
                    [
                        DefendHome(),
                        AttackNearbyEnemy(),
                    ],
                ),
                GatherResources(),
                AttackNearbyEnemy(),
            ],
        )

    def tick(
        self,
        world: World,
        bot,
        dt: float,
    ) -> None:
        self.root.tick(
            world,
            bot,
            dt,
        )
