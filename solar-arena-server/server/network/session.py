"""Сессия игрока — связывает WebSocket с игровым миром."""
import json
import websockets


class Session:
    def __init__(self, ws: websockets.WebSocketServerProtocol, player_id: int):
        self.ws = ws
        self.player_id = player_id
        self.player_name = ""
        self.connected = True

    async def send(self, message: dict) -> None:
        if self.connected:
            try:
                await self.ws.send(json.dumps(message))
            except websockets.ConnectionClosed:
                self.connected = False

    async def close(self) -> None:
        self.connected = False
        await self.ws.close()


class SessionManager:
    def __init__(self):
        self.sessions: dict[int, Session] = {}
        self._next_player_id = 0

    def create(self, ws) -> Session:
        self._next_player_id += 1
        session = Session(ws, self._next_player_id)
        self.sessions[session.player_id] = session
        return session

    def remove(self, session: Session) -> None:
        self.sessions.pop(session.player_id, None)

    async def broadcast(self, message: dict) -> None:
        raw = json.dumps(message)
        dead = []
        for session in self.sessions.values():
            if session.connected:
                try:
                    await session.ws.send(raw)
                except websockets.ConnectionClosed:
                    session.connected = False
                    dead.append(session.player_id)
        for pid in dead:
            self.sessions.pop(pid, None)

    @property
    def count(self) -> int:
        return len(self.sessions)
