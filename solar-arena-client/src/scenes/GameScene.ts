import Phaser from "phaser";
import {
  PLANETS,
  getPlanetByName,
  PlanetData,
} from "../data/planets";
import {
  TILES,
  TILE_SIZE,
  AIR,
} from "../data/tiles";
import { PlanetGenerator } from "../world/PlanetGenerator";
import { NetworkClient } from "../network/NetworkClient";
import { RemoteEntityManager } from "../game/RemoteEntityManager";

interface MiningTarget {
  x: number;
  y: number;
  progress: number;
  hardness: number;
}

interface WasdKeys {
  A: Phaser.Input.Keyboard.Key;
  D: Phaser.Input.Keyboard.Key;
}

export class GameScene extends Phaser.Scene {
  private planet!: PlanetData;

  private tilemap!: Phaser.Tilemaps.Tilemap;
  private groundLayer!: Phaser.Tilemaps.TilemapLayer;

  private player!: Phaser.Physics.Arcade.Sprite;
  private currentAnim = "";
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: WasdKeys;
  private shiftKey!: Phaser.Input.Keyboard.Key;
  private currentAnim: string = "player_idle"; // Добавьте это поле в класс

  private network!: NetworkClient;
  private remoteEntities!: RemoteEntityManager;

  private inventory: Record<string, number> = {};

  private miningTarget: MiningTarget | null = null;
  private mineOverlay!: Phaser.GameObjects.Rectangle;

  private stars!: Phaser.GameObjects.Graphics;
  private aimLine!: Phaser.GameObjects.Line;

  private myEntityId = -1;
  private sendTimer = 0;

  private readonly sendInterval = 0.05;

  /**
   * Блоки, которые уже были удалены локально.
   */
  private destroyedTiles = new Set<string>();

  constructor() {
    super("GameScene");
  }

  init(data: { planet?: string }): void {
    this.planet = getPlanetByName(data?.planet ?? "") ?? PLANETS[2];

    this.inventory = {};
    this.miningTarget = null;
    this.myEntityId = -1;
    this.sendTimer = 0;
    this.destroyedTiles.clear();
  }

  create(): void {
    const mapWidth = this.planet.worldWidth;
    const mapDepth = this.planet.worldDepth;

    // Фон планеты
    this.cameras.main.setBackgroundColor(
      this.getPlanetBackgroundColor(this.planet.name),
    );

    this.createStars();

    // Генерируем мир только один раз.
    // PlanetGenerator должен использовать одинаковый seed.
    const worldData = PlanetGenerator.generate(
      this.planet,
    );

    // Создаём текстуру тайлсета
    this.createTilesetTexture();

    // Создаём tilemap
    this.tilemap = this.make.tilemap({
      data: worldData,
      tileWidth: TILE_SIZE,
      tileHeight: TILE_SIZE,
    });

    /**
     * У атласа нет margin и spacing.
     * Это предотвращает появление полос между блоками.
     */
    const tileset = this.tilemap.addTilesetImage(
      "tiles",
      "tiles",
      TILE_SIZE,
      TILE_SIZE,
      0,
      0,
      0,
    );

    if (!tileset) {
      console.error("Не удалось создать tileset.");
      return;
    }

    this.groundLayer = this.tilemap.createLayer(
      0,
      tileset,
      0,
      0,
    );

    if (!this.groundLayer) {
      console.error("Не удалось создать слой тайлов.");
      return;
    }

    this.groundLayer.setCollisionBetween(1, 999);

    // Физические границы мира
    this.physics.world.setBounds(
      0,
      0,
      mapWidth * TILE_SIZE,
      mapDepth * TILE_SIZE,
    );

    this.physics.world.gravity.y =
      800 * this.planet.gravity;

    // Находим поверхность
    // --- Создание игрока ---

    // --- Создание игрока ---

  const spawnX = Math.floor(mapWidth / 2);
  const surfaceTileY = this.findSurfaceY(worldData, spawnX);

  const groundTopY = surfaceTileY * TILE_SIZE;

  // Исходный кадр в PNG: 64x91.
  // Реальный размер персонажа на экране: 32x40.
  const PLAYER_WIDTH = 32;
  const PLAYER_HEIGHT = 40;

  // Спрайт создаётся немного над поверхностью.
  // После запуска физика плавно поставит его на землю.
  const spawnXPixel =
    spawnX * TILE_SIZE + TILE_SIZE / 2;

  const spawnYPixel =
    groundTopY - PLAYER_HEIGHT / 2 - 4;

  this.player = this.physics.add.sprite(
    spawnXPixel,
    spawnYPixel,
    "player_sheet",
    0,
  );

  this.player.setOrigin(0.5, 0.5);

  this.player.setDisplaySize(
    PLAYER_WIDTH,
    PLAYER_HEIGHT,
  );

  this.player.setBounce(0);
  this.player.setCollideWorldBounds(true);

  const body =
    this.player.body as Phaser.Physics.Arcade.Body;

  /*
    ВАЖНО:

    Исходный кадр: 64x91.
    Его отображение: 32x40.

    Phaser применяет масштаб к телу.
    Поэтому задаём размеры в координатах исходного кадра:

    40 x 82 после масштабирования ≈ 20 x 36 пикселей на экране.
  */
  const BODY_SOURCE_WIDTH = 40;
  const BODY_SOURCE_HEIGHT = 82;

  // Смещение физического тела в исходных координатах кадра.
  // Тело стоит внизу спрайта: его нижняя граница совпадает с ногами.
  const BODY_OFFSET_X = 12;
  const BODY_OFFSET_Y = 10;

  body.setSize(
    BODY_SOURCE_WIDTH,
    BODY_SOURCE_HEIGHT,
    false,
  );

  body.setOffset(
    BODY_OFFSET_X,
    BODY_OFFSET_Y,
  );

  body.updateFromGameObject();

  this.physics.add.collider(
    this.player,
    this.groundLayer,
  );

  this.player.play(
    "player_idle",
    true,
  );

    // Камера
    this.cameras.main.startFollow(
      this.player,
      true,
      0.1,
      0.1,
    );

    this.cameras.main.setZoom(1.2);

    this.cameras.main.setBounds(
      0,
      0,
      mapWidth * TILE_SIZE,
      mapDepth * TILE_SIZE,
    );

    // Удалённые игроки, боты и снаряды
    this.remoteEntities = new RemoteEntityManager(this);

    this.remoteEntities.setMyPlanet(
      this.planet.name,
    );

    this.remoteEntities.setGroundLayer(
      this.groundLayer,
    );

    this.remoteEntities.setOnProjectileHitTile(
      (projectileId: number) => {
        this.network?.send({
          type: "remove_projectile",
          data: {
            id: projectileId,
          },
        });
      },
    );

    // Линия прицела
    this.aimLine = this.add.line(
      0,
      0,
      0,
      0,
      0,
      0,
      0x00d4ff,
      0.3,
    );

    this.aimLine.setLineWidth(1);
    this.aimLine.setDepth(60);

    // Клавиатура
    this.cursors =
      this.input.keyboard!.createCursorKeys();

    this.wasd = this.input.keyboard!.addKeys(
      "A,D",
    ) as WasdKeys;

    this.shiftKey =
      this.input.keyboard!.addKey(
        Phaser.Input.Keyboard.KeyCodes.SHIFT,
      );

    this.input.keyboard!.on(
      "keydown-SPACE",
      this.handleJump,
      this,
    );

    // Мышь
    this.input.on(
      "pointerdown",
      this.handlePointerDown,
      this,
    );

    this.input.on(
      "pointerup",
      this.handlePointerUp,
      this,
    );

    this.input.on(
      "pointermove",
      this.handlePointerMove,
      this,
    );

    this.input.mouse?.disableContextMenu();

    // Индикатор добычи
    this.mineOverlay = this.add.rectangle(
      0,
      0,
      TILE_SIZE,
      TILE_SIZE,
      0xffffff,
      0.2,
    );

    this.mineOverlay.setVisible(false);
    this.mineOverlay.setDepth(100);

    // Подключение к серверу
    this.network = new NetworkClient(
      "ws://26.187.80.134:8765",
    );

    this.network.onSnapshot = (data) => {
      this.onSnapshot(data);
    };

    this.network.onUpdate = (data) => {
      this.onUpdate(data);
    };

    this.network.connect()
      .then(() => {
        this.network.send({
          type: "login",
          data: {
            name: `Player${Math.floor(
              Math.random() * 1000,
            )}`,
            planet: this.planet.name,
            faction: this.planet.name,
          },
        });
      })
      .catch(() => {
        console.warn(
          "[Сеть] Сервер недоступен. Офлайн-режим.",
        );
      });

    // События для HUD
    this.events.emit(
      "inventoryChanged",
      this.inventory,
    );

    this.events.emit(
      "planetChanged",
      this.planet,
    );

    this.scale.on(
      "resize",
      this.handleResize,
      this,
    );
  }

  update(
    _time: number,
    deltaMs: number,
  ): void {
    if (!this.player) {
      return;
    }

    // Защита от слишком большого скачка времени
    const dt = Math.min(
      deltaMs / 1000,
      0.1,
    );

    this.updatePlayerMovement();
    this.updateMining(dt);

    this.remoteEntities?.update(dt);

    this.sendTimer += dt;

    if (this.sendTimer >= this.sendInterval) {
      this.sendTimer = 0;
      this.sendPlayerState();
    }
  }

  private updatePlayerMovement(): void {
    const speed = 130;
    let velocityX = 0;

    if (
      this.cursors.left?.isDown ||
      this.wasd.A.isDown
    ) {
      velocityX -= speed;
    }

    if (
      this.cursors.right?.isDown ||
      this.wasd.D.isDown
    ) {
      velocityX += speed;
    }

    this.player.setVelocityX(velocityX);

    const body =
      this.player.body as Phaser.Physics.Arcade.Body;

    const isOnGround =
      body.blocked.down ||
      body.touching.down;

    let nextAnimation = "player_idle";

    if (!isOnGround) {
      nextAnimation = "player_jump";
    } else if (velocityX !== 0) {
      nextAnimation = "player_walk";
    }

    if (this.currentAnim !== nextAnimation) {
      this.player.play(nextAnimation, true);
      this.currentAnim = nextAnimation;
    }

    if (velocityX < 0) {
      this.player.setFlipX(true);
    } else if (velocityX > 0) {
      this.player.setFlipX(false);
    }
  }

  private updateMining(dt: number): void {
    if (!this.miningTarget) {
      return;
    }

    this.miningTarget.progress += dt;

    const progress =
      this.miningTarget.progress /
      this.miningTarget.hardness;

    this.mineOverlay.setFillStyle(
      0xffffff,
      Phaser.Math.Clamp(
        0.1 + progress * 0.5,
        0.1,
        0.7,
      ),
    );

    if (
      this.miningTarget.progress >=
      this.miningTarget.hardness
    ) {
      const target = this.miningTarget;

      this.stopMining();

      this.breakTile(
        target.x,
        target.y,
      );
    }
  }

  private handleJump(): void {
    if (!this.player?.body) {
      return;
    }

    const body =
      this.player.body as Phaser.Physics.Arcade.Body;

    if (
      body.blocked.down ||
      body.touching.down
    ) {
      this.player.setVelocityY(
        -420 * this.planet.gravity,
      );
    }
  }

  private handlePointerDown(
    pointer: Phaser.Input.Pointer,
  ): void {
    const isShooting =
      pointer.rightButtonDown() ||
      this.shiftKey.isDown;

    if (isShooting) {
      this.shoot(pointer);
    } else {
      this.startMining(pointer);
    }
  }

  private handlePointerUp(): void {
    this.stopMining();
  }

  private handlePointerMove(
    pointer: Phaser.Input.Pointer,
  ): void {
    if (this.miningTarget) {
      const tile = this.getTileAtWorld(
        pointer.worldX,
        pointer.worldY,
      );

      if (
        !tile ||
        tile.x !== this.miningTarget.x ||
        tile.y !== this.miningTarget.y
      ) {
        this.stopMining();
        this.startMining(pointer);
      }
    }

    this.updateAimLine(pointer);
  }

  private shoot(
    pointer: Phaser.Input.Pointer,
  ): void {
    if (!this.network) {
      return;
    }

    const angle = Phaser.Math.Angle.Between(
      this.player.x,
      this.player.y,
      pointer.worldX,
      pointer.worldY,
    );

    this.network.send({
      type: "player_input",
      data: {
        shoot: true,
        angle,
        weapon: "laser_rifle",
      },
    });

    // Локальная вспышка выстрела
    const flash = this.add.circle(
      this.player.x +
        Math.cos(angle) * 15,
      this.player.y +
        Math.sin(angle) * 15,
      4,
      0xffdd00,
      0.8,
    );

    this.tweens.add({
      targets: flash,
      alpha: 0,
      scale: 2,
      duration: 100,
      onComplete: () => {
        flash.destroy();
      },
    });
  }

  private updateAimLine(
    pointer: Phaser.Input.Pointer,
  ): void {
    if (!this.player || !this.aimLine) {
      return;
    }

    const angle = Phaser.Math.Angle.Between(
      this.player.x,
      this.player.y,
      pointer.worldX,
      pointer.worldY,
    );

    const length = 200;

    const endX =
      this.player.x +
      Math.cos(angle) * length;

    const endY =
      this.player.y +
      Math.sin(angle) * length;

    this.aimLine.setPosition(
      this.player.x,
      this.player.y,
    );

    this.aimLine.setTo(
      0,
      0,
      endX - this.player.x,
      endY - this.player.y,
    );
  }

  private sendPlayerState(): void {
    if (
      this.myEntityId === -1 ||
      !this.network ||
      !this.player?.body
    ) {
      return;
    }

    const pointer =
      this.input.activePointer;

    const angle = pointer
      ? Phaser.Math.Angle.Between(
          this.player.x,
          this.player.y,
          pointer.worldX,
          pointer.worldY,
        )
      : 0;

    const body =
      this.player.body as Phaser.Physics.Arcade.Body;

    this.network.send({
      type: "player_position",
      data: {
        x: this.player.x,
        y: this.player.y,
        vx: body.velocity.x,
        vy: body.velocity.y,
        angle,
        weapon: "laser_rifle",
        planet: this.planet.name,
      },
    });
  }

  private getTileAtWorld(
    worldX: number,
    worldY: number,
  ): { x: number; y: number } | null {
    if (!this.groundLayer) {
      return null;
    }

    const tileX = Math.floor(
      worldX / TILE_SIZE,
    );

    const tileY = Math.floor(
      worldY / TILE_SIZE,
    );

    if (
      tileX < 0 ||
      tileX >= this.planet.worldWidth ||
      tileY < 0 ||
      tileY >= this.planet.worldDepth
    ) {
      return null;
    }

    const tile =
      this.groundLayer.getTileAt(
        tileX,
        tileY,
      );

    if (
      !tile ||
      tile.index === AIR ||
      tile.index === -1
    ) {
      return null;
    }

    return {
      x: tileX,
      y: tileY,
    };
  }

  private startMining(
    pointer: Phaser.Input.Pointer,
  ): void {
    const tilePosition =
      this.getTileAtWorld(
        pointer.worldX,
        pointer.worldY,
      );

    if (!tilePosition) {
      return;
    }

    const playerTileX = Math.floor(
      this.player.x / TILE_SIZE,
    );

    const playerTileY = Math.floor(
      this.player.y / TILE_SIZE,
    );

    const distance = Math.hypot(
      tilePosition.x - playerTileX,
      tilePosition.y - playerTileY,
    );

    if (distance > 5) {
      return;
    }

    const tile =
      this.groundLayer.getTileAt(
        tilePosition.x,
        tilePosition.y,
      );

    if (!tile) {
      return;
    }

    const tileDefinition =
      TILES[tile.index];

    if (
      !tileDefinition ||
      tileDefinition.hardness >= 999
    ) {
      return;
    }

    this.miningTarget = {
      x: tilePosition.x,
      y: tilePosition.y,
      progress: 0,
      hardness: tileDefinition.hardness,
    };

    this.mineOverlay.setPosition(
      tilePosition.x * TILE_SIZE +
        TILE_SIZE / 2,
      tilePosition.y * TILE_SIZE +
        TILE_SIZE / 2,
    );

    this.mineOverlay.setVisible(true);

    this.mineOverlay.setFillStyle(
      0xffffff,
      0.15,
    );
  }

  private stopMining(): void {
    this.miningTarget = null;

    if (this.mineOverlay) {
      this.mineOverlay.setVisible(false);
    }
  }

  private breakTile(
    tileX: number,
    tileY: number,
  ): void {
    const key = `${tileX}:${tileY}`;

    if (this.destroyedTiles.has(key)) {
      return;
    }

    const tile =
      this.groundLayer.getTileAt(
        tileX,
        tileY,
      );

    if (!tile || tile.index === AIR) {
      return;
    }

    const tileDefinition =
      TILES[tile.index];

    if (!tileDefinition) {
      return;
    }

    this.destroyedTiles.add(key);

    this.groundLayer.removeTileAt(
      tileX,
      tileY,
    );

    if (tileDefinition.resource) {
      const resource =
        tileDefinition.resource;

      this.inventory[resource] =
        (this.inventory[resource] ?? 0) + 1;

      this.events.emit(
        "inventoryChanged",
        this.inventory,
      );
    }

    this.createMiningParticles(
      tileX * TILE_SIZE +
        TILE_SIZE / 2,
      tileY * TILE_SIZE +
        TILE_SIZE / 2,
      tileDefinition.color,
    );

    this.network.send({
      type: "mine_tile",
      data: {
        x: tileX,
        y: tileY,
        resource: tileDefinition.resource,
      },
    });
  }

  private applyDestroyedTile(
    tileX: number,
    tileY: number,
    createEffect = false,
  ): void {
    const key = `${tileX}:${tileY}`;

    if (this.destroyedTiles.has(key)) {
      return;
    }

    const tile =
      this.groundLayer.getTileAt(
        tileX,
        tileY,
      );

    if (!tile || tile.index === AIR) {
      this.destroyedTiles.add(key);
      return;
    }

    const tileDefinition =
      TILES[tile.index];

    this.destroyedTiles.add(key);

    this.groundLayer.removeTileAt(
      tileX,
      tileY,
    );

    if (
      createEffect &&
      tileDefinition
    ) {
      this.createMiningParticles(
        tileX * TILE_SIZE +
          TILE_SIZE / 2,
        tileY * TILE_SIZE +
          TILE_SIZE / 2,
        tileDefinition.color,
      );
    }
  }

  private createMiningParticles(
    x: number,
    y: number,
    color: number,
  ): void {
    for (let i = 0; i < 6; i++) {
      const particle = this.add.circle(
        x,
        y,
        2,
        color,
        1,
      );

      const angle =
        Math.random() * Math.PI * 2;

      const speed =
        Phaser.Math.Between(30, 80);

      this.tweens.add({
        targets: particle,
        x: x + Math.cos(angle) * speed,
        y:
          y +
          Math.sin(angle) * speed +
          20,
        alpha: 0,
        duration: 400,
        onComplete: () => {
          particle.destroy();
        },
      });
    }
  }

  private onSnapshot(data: any): void {
    if (data.my_entity_id !== undefined) {
      this.myEntityId =
        data.my_entity_id;

      this.events.emit(
        "connected",
        this.myEntityId,
      );
    }

    this.remoteEntities.applySnapshot(
      data,
    );

    const destroyedTiles =
      data.destroyed_tiles ?? [];

    for (const tile of destroyedTiles) {
      this.applyDestroyedTile(
        tile.x,
        tile.y,
        false,
      );
    }
  }

  private onUpdate(data: any): void {
    this.remoteEntities.applyUpdate(
      data,
    );

    const destroyedTiles =
      data.tiles_destroyed ?? [];

    for (const tile of destroyedTiles) {
      this.applyDestroyedTile(
        tile.x,
        tile.y,
        true,
      );
    }
  }

  private getPlanetBackgroundColor(
    planetName: string,
  ): string {
    const colors: Record<
      string,
      string
    > = {
      Mercury: "#1a1a1a",
      Venus: "#2a1a0a",
      Earth: "#0a1020",
      Mars: "#1a0a0a",
      Jupiter: "#1a1a0a",
      Saturn: "#1a150a",
    };

    return colors[planetName] ?? "#050714";
  }

  private createStars(): void {
    this.stars = this.add.graphics();

    const worldWidth =
      this.planet.worldWidth * TILE_SIZE;

    const skyHeight =
      this.planet.surfaceLevel * TILE_SIZE;

    for (let i = 0; i < 300; i++) {
      const x = Phaser.Math.Between(
        0,
        worldWidth,
      );

      const y = Phaser.Math.Between(
        0,
        Math.max(1, skyHeight - 50),
      );

      const size =
        Phaser.Math.FloatBetween(
          0.5,
          2,
        );

      this.stars.fillStyle(
        0xffffff,
        Phaser.Math.FloatBetween(
          0.2,
          0.7,
        ),
      );

      this.stars.fillCircle(
        x,
        y,
        size,
      );
    }

    this.stars.setScrollFactor(0.3);
    this.stars.setDepth(-1);
  }

  /**
   * Создаёт тайлсет.
   *
   * ID 0 — прозрачный воздух.
   * ID 1 — dirt.
   * ID 2 — stone.
   * ID 3 — bedrock.
   */
  private createTilesetTexture(): void {
    const tileSize = TILE_SIZE;
    const columns = 10;

    let maxTileId = 0;

    for (const id of Object.keys(TILES)) {
      maxTileId = Math.max(
        maxTileId,
        Number(id),
      );
    }

    const rows =
      Math.floor(maxTileId / columns) + 1;

    const canvas =
      document.createElement("canvas");

    canvas.width =
      columns * tileSize;

    canvas.height =
      rows * tileSize;

    const context =
      canvas.getContext("2d");

    if (!context) {
      throw new Error(
        "Не удалось получить CanvasRenderingContext2D",
      );
    }

    context.imageSmoothingEnabled =
      false;

    context.clearRect(
      0,
      0,
      canvas.width,
      canvas.height,
    );

    const dirtImage =
      this.textures
        .get("png_dirt")
        .getSourceImage() as HTMLImageElement;

    const stoneImage =
      this.textures
        .get("png_stone")
        .getSourceImage() as HTMLImageElement;

    const bedrockImage =
      this.textures
        .get("png_bedrock")
        .getSourceImage() as HTMLImageElement;

    for (const [
      idString,
      tile,
    ] of Object.entries(TILES)) {
      const tileId = Number(idString);

      // Воздух остаётся прозрачным.
      if (tileId === AIR) {
        continue;
      }

      const column =
        tileId % columns;

      const row =
        Math.floor(tileId / columns);

      const x =
        column * tileSize;

      const y =
        row * tileSize;

      if (tileId === 1) {
        context.drawImage(
          dirtImage,
          x,
          y,
          tileSize,
          tileSize,
        );

        continue;
      }

      if (tileId === 2) {
        context.drawImage(
          stoneImage,
          x,
          y,
          tileSize,
          tileSize,
        );

        continue;
      }

      if (tileId === 3) {
        context.drawImage(
          bedrockImage,
          x,
          y,
          tileSize,
          tileSize,
        );

        continue;
      }

      // Временный вид ресурсов:
      // камень + цветные вкрапления.
      context.drawImage(
        stoneImage,
        x,
        y,
        tileSize,
        tileSize,
      );

      context.fillStyle =
        `#${tile.color
          .toString(16)
          .padStart(6, "0")}`;

      for (let i = 0; i < 6; i++) {
        const spotX =
          x +
          3 +
          Math.floor(
            Math.random() *
              (tileSize - 8),
          );

        const spotY =
          y +
          3 +
          Math.floor(
            Math.random() *
              (tileSize - 8),
          );

        const spotSize =
          2 +
          Math.floor(
            Math.random() * 4,
          );

        context.globalAlpha = 0.65;

        context.fillRect(
          spotX,
          spotY,
          spotSize,
          spotSize,
        );
      }

      context.globalAlpha = 1;
    }

    if (this.textures.exists("tiles")) {
      this.textures.remove("tiles");
    }

    const texture =
      this.textures.addCanvas(
        "tiles",
        canvas,
      );

    texture.setFilter(
      Phaser.Textures.FilterMode.NEAREST,
    );
  }

  private findSurfaceY(
    worldData: number[][],
    x: number,
  ): number {
    for (let y = 0; y < worldData.length; y++) {
      if (worldData[y][x] !== AIR) {
        return y;
      }
    }

    return this.planet.surfaceLevel;
  }

  private handleResize(
    gameSize: Phaser.Structs.Size,
  ): void {
    this.cameras.main.setSize(
      gameSize.width,
      gameSize.height,
    );
  }

  shutdown(): void {
    this.input.keyboard?.off(
      "keydown-SPACE",
      this.handleJump,
      this,
    );

    this.input.off(
      "pointerdown",
      this.handlePointerDown,
      this,
    );

    this.input.off(
      "pointerup",
      this.handlePointerUp,
      this,
    );

    this.input.off(
      "pointermove",
      this.handlePointerMove,
      this,
    );

    this.scale.off(
      "resize",
      this.handleResize,
      this,
    );

    this.remoteEntities?.clear();
    this.network?.disconnect();
  }
}
