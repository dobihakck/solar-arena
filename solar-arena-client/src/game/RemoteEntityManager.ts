import Phaser from "phaser";
import { TILE_SIZE, AIR } from "../data/tiles";

const ENTITY_COLORS: Record<string, number> = {
  player: 0x00d4ff,
  ai_bot: 0xff4444,
  projectile: 0xffdd00,
  planet: 0x888888,
};

interface RemoteEntity {
  id: number;
  type: string;
  sprite: Phaser.GameObjects.Container;
  lastX: number;
  lastY: number;
  targetX: number;
  targetY: number;
}

export class RemoteEntityManager {
  private scene: Phaser.Scene;
  private entities: Map<number, RemoteEntity> = new Map();
  private myEntityId: number = -1;
  private groundLayer: Phaser.Tilemaps.TilemapLayer | null = null;
  private onProjectileHitTile: ((id: number) => void) | null = null;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  /** Передать ссылку на слой тайлов для проверки коллизий пуль */
  setGroundLayer(layer: Phaser.Tilemaps.TilemapLayer): void {
    this.groundLayer = layer;
  }

  /** Колбэк при попадании пули в тайл */
  setOnProjectileHitTile(cb: (id: number) => void): void {
    this.onProjectileHitTile = cb;
  }

  setMyEntityId(id: number): void {
    this.myEntityId = id;
  }

  private myPlanet: string = "";

  setMyPlanet(planet: string): void {
    this.myPlanet = planet;
  }

  applySnapshot(data: any): void {
    if (data.my_entity_id !== undefined) {
      this.setMyEntityId(data.my_entity_id);
    }

    for (const entity of data.entities ?? []) {
      if (entity.id === this.myEntityId) {
        continue;
      }

      if (entity.type === "planet") {
        continue;
      }

      if (
        entity.planet &&
        this.myPlanet &&
        entity.planet !== this.myPlanet
      ) {
        continue;
      }

      this.createEntity(entity);
    }
  }

  applyUpdate(data: any): void {
    for (const entity of data.updates ?? []) {
      if (entity.id === this.myEntityId) {
        continue;
      }

      if (entity.type === "planet") {
        continue;
      }

      if (
        entity.planet &&
        this.myPlanet &&
        entity.planet !== this.myPlanet
      ) {
        continue;
      }

      const existing = this.entities.get(entity.id);

      if (existing) {
        this.updateEntity(existing, entity);
      } else {
        this.createEntity(entity);
      }
    }

    for (const id of data.despawns ?? []) {
      if (id !== this.myEntityId) {
        this.removeEntity(id);
      }
    }
  }

  update(dt: number): void {
    const lerpFactor = Math.min(1, dt * 10);
    for (const entity of this.entities.values()) {
      // Интерполяция
      entity.sprite.x = Phaser.Math.Linear(entity.sprite.x, entity.targetX, lerpFactor);
      entity.sprite.y = Phaser.Math.Linear(entity.sprite.y, entity.targetY, lerpFactor);

      // Проверка пуль на столкновение с тайлами
      if (entity.type === "projectile" && this.groundLayer) {
        const tileX = Math.floor(entity.sprite.x / TILE_SIZE);
        const tileY = Math.floor(entity.sprite.y / TILE_SIZE);
        const tile = this.groundLayer.getTileAt(tileX, tileY);
        if (tile && tile.index !== AIR && tile.index !== -1) {
          // Пуля врезалась в блок — эффект + запрос на удаление
          this.createHitEffect(entity.sprite.x, entity.sprite.y);
          if (this.onProjectileHitTile) {
            this.onProjectileHitTile(entity.id);
          }
          this.removeEntity(entity.id);
        }
      }
    }
  }

  clear(): void {
    for (const entity of this.entities.values()) {
      entity.sprite.destroy();
    }
    this.entities.clear();
  }

  private createEntity(data: any): void {
    const color = ENTITY_COLORS[data.type] ?? 0xffffff;
    const container = this.scene.add.container(data.x, data.y);
    container.setDepth(50);

    if (data.type === "projectile") {
      const proj = this.scene.add.circle(0, 0, 3, color, 1);
      proj.setBlendMode(Phaser.BlendModes.ADD);
      container.add(proj);
      const trail = this.scene.add.circle(0, 0, 5, color, 0.3);
      container.add(trail);
    } else {
      const body = this.scene.add.graphics();
      body.fillStyle(color, 0.9);
      body.fillRoundedRect(-10, -10, 20, 20, 4);
      body.lineStyle(2, color, 1);
      body.strokeRoundedRect(-10, -10, 20, 20, 4);
      body.fillStyle(0xffffff, 0.6);
      body.fillCircle(0, -2, 3);
      container.add(body);

      const hpBg = this.scene.add.rectangle(0, -18, 24, 4, 0x000000, 0.5);
      const hpBar = this.scene.add.rectangle(0, -18, 24, 4, 0x00ff44, 0.9);
      hpBar.setOrigin(0, 0.5);
      hpBg.setOrigin(0.5, 0.5);
      container.add(hpBg);
      container.add(hpBar);

      if (data.name) {
        const nameText = this.scene.add.text(0, -26, data.name, {
          fontFamily: "Arial, sans-serif",
          fontSize: "10px",
          color: "#aaaaaa",
        }).setOrigin(0.5);
        container.add(nameText);
      }

      container.setData("hpBar", hpBar);
      container.setData("hpBg", hpBg);
    }

    const entity: RemoteEntity = {
      id: data.id,
      type: data.type,
      sprite: container,
      lastX: data.x,
      lastY: data.y,
      targetX: data.x,
      targetY: data.y,
    };

    this.entities.set(data.id, entity);
  }

  private updateEntity(entity: RemoteEntity, data: any): void {
    entity.lastX = entity.targetX;
    entity.lastY = entity.targetY;
    entity.targetX = data.x;
    entity.targetY = data.y;

    if (data.hp !== undefined) {
      const hpBar = entity.sprite.getData("hpBar") as Phaser.GameObjects.Rectangle | null;
      if (hpBar) {
        const maxHp = 100;
        const pct = Math.max(0, Math.min(1, data.hp / maxHp));
        hpBar.width = 24 * pct;
        hpBar.fillColor = pct > 0.5 ? 0x00ff44 : pct > 0.25 ? 0xffaa00 : 0xff4444;
      }
    }

    if (data.name) {
      const texts = entity.sprite.list.filter(
        (c) => c instanceof Phaser.GameObjects.Text
      ) as Phaser.GameObjects.Text[];
      if (texts.length > 0) {
        texts[0].setText(data.name);
      }
    }
  }

  private removeEntity(id: number): void {
    const entity = this.entities.get(id);
    if (entity) {
      this.scene.tweens.add({
        targets: entity.sprite,
        alpha: 0,
        scale: 0.5,
        duration: 200,
        onComplete: () => {
          entity.sprite.destroy();
        },
      });
      this.entities.delete(id);
    }
  }

  private createHitEffect(x: number, y: number): void {
    for (let i = 0; i < 4; i++) {
      const spark = this.scene.add.circle(x, y, 2, 0xffdd00, 1);
      const angle = Math.random() * Math.PI * 2;
      const speed = Phaser.Math.Between(20, 50);
      this.scene.tweens.add({
        targets: spark,
        x: x + Math.cos(angle) * speed,
        y: y + Math.sin(angle) * speed,
        alpha: 0,
        duration: 200,
        onComplete: () => spark.destroy(),
      });
    }
  }
}
