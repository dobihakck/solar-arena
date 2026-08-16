"""Заглушка persistence-слоя. Реализация — позже."""


class Database:
    async def save_world(self, world) -> None:
        pass

    async def load_world(self) -> dict | None:
        return None
