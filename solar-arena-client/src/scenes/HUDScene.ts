import Phaser from "phaser";
import { PlanetData } from "../data/planets";
import { TILES } from "../data/tiles";

export class HUDScene extends Phaser.Scene {
  private inventoryText!: Phaser.GameObjects.Text;
  private planetNameText!: Phaser.GameObjects.Text;
  private healthBar!: Phaser.GameObjects.Rectangle;
  private healthBg!: Phaser.GameObjects.Rectangle;
  private inventoryPanel!: Phaser.GameObjects.Graphics;
  private depthText!: Phaser.GameObjects.Text;

  constructor() {
    super("HUDScene");
  }

  create(): void {
    const W = this.scale.width;

    const topPanel = this.add.graphics();
    topPanel.fillStyle(0x050714, 0.6);
    topPanel.fillRect(0, 0, W, 50);
    topPanel.lineStyle(1, 0x00d4ff, 0.2);
    topPanel.beginPath();
    topPanel.moveTo(0, 50);
    topPanel.lineTo(W, 50);
    topPanel.strokePath();

    this.planetNameText = this.add.text(20, 15, "", {
      fontFamily: "Arial, sans-serif",
      fontSize: "14px",
      color: "#00d4ff",
      letterSpacing: 3,
    });

    this.depthText = this.add.text(W - 20, 15, "Глубина: 0м", {
      fontFamily: "Arial, sans-serif",
      fontSize: "12px",
      color: "#5a7a9a",
    }).setOrigin(1, 0);

    const hbX = W / 2 - 100;
    const hbY = 15;

    this.healthBg = this.add.rectangle(hbX, hbY, 200, 12, 0x0a0e27, 0.8);
    this.healthBg.setStrokeStyle(1, 0x00d4ff, 0.3);
    this.healthBg.setOrigin(0);

    this.healthBar = this.add.rectangle(hbX, hbY, 200, 12, 0x00d4ff, 0.8);
    this.healthBar.setOrigin(0);

    this.add.text(hbX, hbY + 16, "HP", {
      fontFamily: "Arial, sans-serif",
      fontSize: "10px",
      color: "#3a5a7a",
    });

    this.inventoryPanel = this.add.graphics();
    this.inventoryText = this.add.text(20, this.scale.height - 120, "", {
      fontFamily: "Arial, sans-serif",
      fontSize: "12px",
      color: "#8a9ab0",
      lineSpacing: 4,
    });

    const gameScene = this.scene.get("GameScene");

    gameScene.events.on("planetChanged", (planet: PlanetData) => {
      this.planetNameText.setText(`▸ ${planet.displayName.toUpperCase()}`);
    });

    gameScene.events.on("inventoryChanged", (inv: Record<string, number>) => {
      this.updateInventory(inv);
    });

    gameScene.events.on("connected", (entityId: number) => {
      this.add.text(W / 2, 30, `✓ Подключено  ID: ${entityId}`, {
        fontFamily: "Arial, sans-serif",
        fontSize: "10px",
        color: "#00aa44",
      }).setOrigin(0.5).setAlpha(0.7);
    });

    this.time.addEvent({
      delay: 200,
      callback: () => {
        const gameScene = this.scene.get("GameScene") as any;
        if (gameScene?.player && gameScene?.planet) {
          const surfaceY = gameScene.planet.surfaceLevel * 28;
          const depth = Math.max(0, Math.floor((gameScene.player.y - surfaceY) / 28));
          this.depthText.setText(`Глубина: ${depth * 2}м`);
        }
      },
      loop: true,
    });

    this.scale.on("resize", (gameSize: Phaser.Structs.Size) => {
      this.cameras.main.setSize(gameSize.width, gameSize.height);
    });
  }

  private updateInventory(inv: Record<string, number>): void {
    const entries = Object.entries(inv);
    if (entries.length === 0) {
      this.inventoryText.setText("Инвентарь пуст");
      this.inventoryPanel.clear();
      return;
    }

    const lines: string[] = [];
    const colors: { name: string; color: number; count: number }[] = [];

    for (const [name, count] of entries) {
      const tileEntry = Object.entries(TILES).find(
        ([, t]) => t.resource === name
      );
      const color = tileEntry ? TILES[parseInt(tileEntry[0])].color : 0x888888;
      lines.push(`${name}: ${count}`);
      colors.push({ name, color, count });
    }

    this.inventoryText.setText(["ИНВЕНТАРЬ", ...lines].join("\n"));

    this.inventoryPanel.clear();
    this.inventoryPanel.fillStyle(0x050714, 0.6);
    this.inventoryPanel.fillRect(10, this.scale.height - 130, 200, 24 + entries.length * 18);
    this.inventoryPanel.lineStyle(1, 0x00d4ff, 0.15);
    this.inventoryPanel.strokeRect(10, this.scale.height - 130, 200, 24 + entries.length * 18);

    colors.forEach((c, i) => {
      const y = this.scale.height - 110 + i * 18;
      this.inventoryPanel.fillStyle(c.color, 0.9);
      this.inventoryPanel.fillRect(18, y, 12, 12);
    });
  }
}
