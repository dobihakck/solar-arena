"""AI-контроллер — управляет всеми ботами."""
from server.game.world import World
from server.game.ai.behaviors import BehaviorTree


class AIController:

    def __init__(self):
        self.behaviors: dict[int, BehaviorTree] = {}

    def register_bot(self, bot_id: int) -> None:
        self.behaviors[bot_id] = BehaviorTree()

    def update(self, world: World, dt: float) -> None:
        for bot_id, behavior in list(self.behaviors.items()):
            bot = world.bots.get(bot_id)
            if not bot or not bot.alive:
                self.behaviors.pop(bot_id, None)
                continue
            behavior.tick(world, bot, dt)
