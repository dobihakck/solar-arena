"""Конфигурация сервера."""
from dataclasses import dataclass


@dataclass
class ServerConfig:
    host: str = "0.0.0.0"
    port: int = 8765
    max_players: int = 50
    world_seed: int = 42
    save_interval: int = 600


config = ServerConfig()
