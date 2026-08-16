export class NetworkClient {
  private ws: WebSocket | null = null;
  private url: string;
  private connected = false;
  private sendQueue: any[] = [];
  private reconnectTimer: number | null = null;

  onSnapshot: (data: any) => void = () => {};
  onUpdate: (data: any) => void = () => {};
  onConnected: () => void = () => {};
  onDisconnected: () => void = () => {};

  constructor(url: string) {
    this.url = url;
  }

  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.url);

        this.ws.onopen = () => {
          this.connected = true;
          console.log("[Network] Подключено к серверу");
          this.sendQueue.forEach((msg) => this.ws!.send(JSON.stringify(msg)));
          this.sendQueue = [];
          this.onConnected();
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const msg = JSON.parse(event.data);
            if (msg.type === "world_snapshot") {
              this.onSnapshot(msg.data);
            } else if (msg.type === "world_update") {
              this.onUpdate(msg.data);
            }
          } catch (e) {
            console.error("[Network] Ошибка парсинга:", e);
          }
        };

        this.ws.onerror = (err) => {
          console.error("[Network] Ошибка:", err);
          if (!this.connected) reject(err);
        };

        this.ws.onclose = () => {
          this.connected = false;
          console.log("[Network] Отключено");
          this.onDisconnected();
          this.scheduleReconnect();
        };
      } catch (e) {
        reject(e);
      }
    });
  }

  send(msg: any): void {
    if (this.ws && this.connected) {
      this.ws.send(JSON.stringify(msg));
    } else {
      this.sendQueue.push(msg);
    }
  }

  private scheduleReconnect(): void {
    if (this.reconnectTimer) return;
    this.reconnectTimer = window.setTimeout(() => {
      this.reconnectTimer = null;
      this.connect().catch(() => {});
    }, 3000);
  }

  disconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.ws?.close();
  }
}
