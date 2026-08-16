"""Точка входа."""
import asyncio
from server.network.server import GameServer


async def main():
    server = GameServer(host="0.0.0.0", port=8765)
    await server.start()


if __name__ == "__main__":
    asyncio.run(main())
