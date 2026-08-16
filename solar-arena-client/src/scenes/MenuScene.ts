import Phaser from "phaser";
import { PLANETS, PlanetData } from "../data/planets";

export class MenuScene extends Phaser.Scene {
  private selectedPlanet: PlanetData = PLANETS[2];
  private planetButtons: Phaser.GameObjects.Container[] = [];
  private titleText!: Phaser.GameObjects.Text;
  private descText!: Phaser.GameObjects.Text;

  constructor() {
    super("MenuScene");
  }

  create(): void {
    const W = this.scale.width;
    const H = this.scale.height;

    this.cameras.main.setBackgroundColor("#050714");

    // --- Звёзды ---
    for (let i = 0; i < 200; i++) {
      const x = Phaser.Math.Between(0, W);
      const y = Phaser.Math.Between(0, H);
      const size = Phaser.Math.FloatBetween(0.5, 2.5);
      const alpha = Phaser.Math.FloatBetween(0.2, 0.8);
      const star = this.add.circle(x, y, size, 0xffffff, alpha);
      this.tweens.add({
        targets: star,
        alpha: { from: alpha, to: alpha * 0.3 },
        duration: Phaser.Math.Between(1000, 4000),
        yoyo: true,
        repeat: -1,
        ease: "Sine.inOut",
      });
    }

    // --- Туманности ---
    this.add.circle(W * 0.7, H * 0.3, 300, 0x1a2050, 0.15);
    this.add.circle(W * 0.2, H * 0.8, 250, 0x501a30, 0.08);

    // --- Заголовок ---
    this.titleText = this.add.text(W / 2, H * 0.12, "SOLAR  ARENA", {
      fontFamily: "Arial, sans-serif",
      fontSize: "48px",
      color: "#00d4ff",
      letterSpacing: 8,
      fontStyle: "bold",
    }).setOrigin(0.5);

    this.tweens.add({
      targets: this.titleText,
      alpha: { from: 0.85, to: 1 },
      duration: 2000,
      yoyo: true,
      repeat: -1,
      ease: "Sine.inOut",
    });

    this.add.text(W / 2, H * 0.12 + 40, "БИТВА  ЗА  РЕСУРСЫ", {
      fontFamily: "Arial, sans-serif",
      fontSize: "14px",
      color: "#5a7a9a",
      letterSpacing: 6,
    }).setOrigin(0.5);

    // --- Подзаголовок ---
    this.add.text(W / 2, H * 0.28, "ВЫБЕРИТЕ  ПЛАНЕТУ", {
      fontFamily: "Arial, sans-serif",
      fontSize: "12px",
      color: "#3a5a7a",
      letterSpacing: 4,
    }).setOrigin(0.5);

    // --- Кнопки планет ---
    const planetY = H * 0.42;
    const spacing = Math.min(140, W / (PLANETS.length + 1));
    const startX = W / 2 - (PLANETS.length - 1) * spacing / 2;

    PLANETS.forEach((planet, i) => {
      const x = startX + i * spacing;
      const btn = this.createPlanetButton(x, planetY, planet);
      this.planetButtons.push(btn);
    });

    // --- Описание ---
    this.descText = this.add.text(W / 2, H * 0.62, "", {
      fontFamily: "Arial, sans-serif",
      fontSize: "14px",
      color: "#8a9ab0",
      align: "center",
      wordWrap: { width: 500 },
    }).setOrigin(0.5);

    this.updateDescription();

    // --- Кнопка PLAY ---
    const playY = H * 0.82;
    const playBtn = this.add.container(W / 2, playY);

    const playBg = this.add.graphics();
    playBg.lineStyle(2, 0x00d4ff, 0.8);
    playBg.fillStyle(0x0a0e27, 0.6);
    playBg.fillRoundedRect(-80, -22, 160, 44, 6);
    playBg.strokeRoundedRect(-80, -22, 160, 44, 6);

    const playText = this.add.text(0, 0, "▶  НАЧАТЬ", {
      fontFamily: "Arial, sans-serif",
      fontSize: "16px",
      color: "#00d4ff",
      letterSpacing: 3,
    }).setOrigin(0.5);

    playBtn.add([playBg, playText]);
    playBtn.setSize(160, 44);
    playBtn.setInteractive({ useHandCursor: true });

    playBtn.on("pointerover", () => {
      playBg.clear();
      playBg.lineStyle(2, 0x00d4ff, 1);
      playBg.fillStyle(0x0a1e3a, 0.8);
      playBg.fillRoundedRect(-80, -22, 160, 44, 6);
      playBg.strokeRoundedRect(-80, -22, 160, 44, 6);
    });

    playBtn.on("pointerout", () => {
      playBg.clear();
      playBg.lineStyle(2, 0x00d4ff, 0.8);
      playBg.fillStyle(0x0a0e27, 0.6);
      playBg.fillRoundedRect(-80, -22, 160, 44, 6);
      playBg.strokeRoundedRect(-80, -22, 160, 44, 6);
    });

    playBtn.on("pointerdown", () => {
      this.cameras.main.fadeOut(400, 0, 0, 0);
      this.time.delayedCall(400, () => {
        this.scene.start("GameScene", { planet: this.selectedPlanet.name });
      });
    });

    // --- Подсказка управления ---
    this.add.text(
      W / 2, H - 30,
      "WASD — движение  •  ЛКМ — копать  •  ПРОБЕЛ — прыжок  •  ПКМ — стрелять",
      {
        fontFamily: "Arial, sans-serif",
        fontSize: "11px",
        color: "#2a3a5a",
        letterSpacing: 2,
      }
    ).setOrigin(0.5);
  }

  private createPlanetButton(
  x: number,
  y: number,
  planet: PlanetData
): Phaser.GameObjects.Container {
  const container = this.add.container(x, y);
  const isSelected = planet.name === this.selectedPlanet.name;

  // [0] Свечение
  const glow = this.add.circle(
    0, 0, planet.radius + 12, planet.accentColor, 0.05
  );

  // [1] Тело планеты
  const circle = this.add.circle(0, 0, planet.radius, planet.color, 1);

  // [2] Детали планеты
  const detail = this.add.graphics();

  if (planet.name === "Saturn") {
    // Кольца Сатурна (используем strokeEllipse)
    detail.lineStyle(3, planet.accentColor, 0.6);
    detail.strokeEllipse(0, 0, planet.radius * 2 + 36, 12);

    detail.lineStyle(1, planet.accentColor, 0.3);
    detail.strokeEllipse(0, 0, planet.radius * 2 + 50, 16);
  } else if (planet.name === "Jupiter") {
    // Полосы Юпитера
    detail.lineStyle(2, 0x8a7a5a, 0.5);
    for (let i = -3; i <= 3; i++) {
      const yy = i * (planet.radius / 4);
      detail.beginPath();
      detail.moveTo(-planet.radius * 0.9, yy);
      detail.lineTo(planet.radius * 0.9, yy);
      detail.strokePath();
    }
  } else if (planet.name === "Earth") {
    // Континенты
    detail.fillStyle(0x2a6a3a, 0.7);
    detail.fillCircle(
      -planet.radius * 0.3, -planet.radius * 0.2, planet.radius * 0.3
    );
    detail.fillCircle(
      planet.radius * 0.3, planet.radius * 0.3, planet.radius * 0.25
    );
  } else if (planet.name === "Mars") {
    // Полярные шапки
    detail.fillStyle(0xffffff, 0.5);
    detail.fillCircle(0, -planet.radius * 0.7, planet.radius * 0.2);
  } else if (planet.name === "Venus") {
    // Облака
    detail.fillStyle(0xffffff, 0.2);
    detail.fillCircle(
      -planet.radius * 0.2, planet.radius * 0.1, planet.radius * 0.3
    );
    detail.fillCircle(
      planet.radius * 0.3, -planet.radius * 0.2, planet.radius * 0.25
    );
  } else if (planet.name === "Mercury") {
    // Кратеры
    detail.fillStyle(0x000000, 0.3);
    detail.fillCircle(-planet.radius * 0.3, planet.radius * 0.3, 3);
    detail.fillCircle(planet.radius * 0.2, -planet.radius * 0.1, 2);
    detail.fillCircle(planet.radius * 0.4, planet.radius * 0.4, 2);
  }

  // [3] Кольцо выделения
  const ring = this.add.circle(0, 0, planet.radius + 6, 0x00d4ff, 0);
  ring.setStrokeStyle(2, 0x00d4ff, isSelected ? 1 : 0);

  // [4] Название
  const label = this.add.text(0, planet.radius + 18, planet.displayName, {
    fontFamily: "Arial, sans-serif",
    fontSize: "12px",
    color: isSelected ? "#00d4ff" : "#5a7a9a",
    letterSpacing: 1,
  }).setOrigin(0.5);

  // Добавляем в контейнер
  container.add([glow, circle, detail, ring, label]);
  container.setSize(planet.radius * 2 + 20, planet.radius * 2 + 40);
  container.setInteractive({ useHandCursor: true });

  // Сохраняем ссылки по имени
  container.setData("ring", ring);
  container.setData("label", label);
  container.setData("glow", glow);

  container.on("pointerover", () => {
    this.tweens.add({
      targets: container,
      scale: 1.1,
      duration: 200,
      ease: "Sine.out",
    });
    glow.setAlpha(0.15);
  });

  container.on("pointerout", () => {
    if (planet.name !== this.selectedPlanet.name) {
      this.tweens.add({
        targets: container,
        scale: 1,
        duration: 200,
        ease: "Sine.out",
      });
      glow.setAlpha(0.05);
    }
  });

  container.on("pointerdown", () => {
    this.selectedPlanet = planet;
    this.refreshSelection();
  });

  return container;
}

  private refreshSelection(): void {
    this.planetButtons.forEach((btn) => {
      const planet = PLANETS.find((p) => {
        const label = btn.getData("label") as Phaser.GameObjects.Text;
        return label.text === p.displayName;
      });
      if (!planet) return;

      const isSelected = planet.name === this.selectedPlanet.name;

      // Используем getData вместо индексов — надёжно
      const ring = btn.getData("ring") as Phaser.GameObjects.Arc;
      ring.setStrokeStyle(2, 0x00d4ff, isSelected ? 1 : 0);

      const label = btn.getData("label") as Phaser.GameObjects.Text;
      label.setColor(isSelected ? "#00d4ff" : "#5a7a9a");

      const glow = btn.getData("glow") as Phaser.GameObjects.Arc;
      glow.setAlpha(isSelected ? 0.15 : 0.05);

      if (isSelected) {
        this.tweens.add({
          targets: btn,
          scale: 1.1,
          duration: 200,
          ease: "Sine.out",
        });
      } else {
        this.tweens.add({
          targets: btn,
          scale: 1,
          duration: 200,
          ease: "Sine.out",
        });
      }
    });
    this.updateDescription();
  }

  private updateDescription(): void {
    const p = this.selectedPlanet;
    this.descText.setText(
      `${p.description}\n\n` +
      `Гравитация: ${p.gravity}g   •   Температура: ${p.temperature}°C\n` +
      `Атмосфера: ${p.hasAtmosphere ? "есть" : "нет"}   •   ` +
      `Богатство ресурсов: ${Math.round(p.resourceRichness * 100)}%`
    );
  }
}
