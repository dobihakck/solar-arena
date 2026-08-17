import Phaser from "phaser";
import { TILES } from "../data/tiles";

export class BootScene extends Phaser.Scene {
  constructor() {
    super("BootScene");
  }

  preload(): void {
    // Один спрайт-лист: 5 кадров по 64x91
    this.load.spritesheet(
      "player_sheet",
      "assets/sprites/player.png",
      {
        frameWidth: 64,
        frameHeight: 91,
      },
    );

    // Текстуры базовых блоков
    this.load.image(
      "png_dirt",
      "assets/tiles/tile_dirt.png",
    );

    this.load.image(
      "png_stone",
      "assets/tiles/tile_stone.png",
    );

    this.load.image(
      "png_bedrock",
      "assets/tiles/tile_bedrock.png",
    );
  }

  create(): void {
    this.createAnimations();
    this.createTileTextures();
    this.createStarTexture();

    this.scene.start("MenuScene");
  }

  private createAnimations(): void {
    if (!this.anims.exists("player_idle")) {
      this.anims.create({
        key: "player_idle",
        frames: [
          {
            key: "player_sheet",
            frame: 2,
          },
        ],
        frameRate: 2,
        repeat: -1,
      });
    }

    if (!this.anims.exists("player_walk")) {
      this.anims.create({
        key: "player_walk",
        frames: [
          {
            key: "player_sheet",
            frame: 1,
          },
          {
            key: "player_sheet",
            frame: 2,
          },
        ],
        frameRate: 6,
        repeat: -2,
      });
    }

    if (!this.anims.exists("player_jump")) {
      this.anims.create({
        key: "player_jump",
        frames: [
          {
            key: "player_sheet",
            frame: 1,
          },
          {
            key: "player_sheet",
            frame: 2,
          },
        ],
        frameRate: 6,
        repeat: -1,
      });
    }
  }



  private createTileTextures(): void {
    const tileSize = 28;

    for (const [idString, tile] of Object.entries(TILES)) {
      const id = Number(idString);

      if (id === 0) {
        continue;
      }

      const key = `tile_${id}`;

      if (this.textures.exists(key)) {
        continue;
      }

      const graphics = this.add.graphics();

      graphics.fillStyle(tile.color, 1);
      graphics.fillRect(
        0,
        0,
        tileSize,
        tileSize,
      );

      graphics.lineStyle(
        1,
        tile.edgeColor,
        0.4,
      );

      graphics.strokeRect(
        0,
        0,
        tileSize,
        tileSize,
      );

      graphics.generateTexture(
        key,
        tileSize,
        tileSize,
      );

      graphics.destroy();
    }
  }

  private createStarTexture(): void {
    if (this.textures.exists("star")) {
      return;
    }

    const graphics = this.add.graphics();

    graphics.fillStyle(0xffffff, 1);
    graphics.fillCircle(2, 2, 2);

    graphics.generateTexture(
      "star",
      4,
      4,
    );

    graphics.destroy();
  }
}
