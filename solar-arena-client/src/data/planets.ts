export interface PlanetData {
  name: string;
  displayName: string;
  color: number;
  accentColor: number;
  radius: number;
  description: string;
  gravity: number;
  worldWidth: number;
  worldDepth: number;
  surfaceLevel: number;
  temperature: number;
  hasAtmosphere: boolean;
  resourceRichness: number;
}

export const PLANETS: PlanetData[] = [
  {
    name: "Mercury",
    displayName: "Меркурий",
    color: 0x8c7853,
    accentColor: 0xc0a070,
    radius: 22,
    description: "Ближайшая к Солнцу. Богата железом и серой. Нет атмосферы.",
    gravity: 0.38,
    worldWidth: 200,
    worldDepth: 100,
    surfaceLevel: 25,
    temperature: 167,
    hasAtmosphere: false,
    resourceRichness: 0.8,
  },
  {
    name: "Venus",
    displayName: "Венера",
    color: 0xffc649,
    accentColor: 0xffd97a,
    radius: 28,
    description: "Адские температуры. Базальтовая поверхность. Много серы.",
    gravity: 0.91,
    worldWidth: 220,
    worldDepth: 100,
    surfaceLevel: 25,
    temperature: 464,
    hasAtmosphere: true,
    resourceRichness: 0.6,
  },
  {
    name: "Earth",
    displayName: "Земля",
    color: 0x4a90d9,
    accentColor: 0x6bb6ff,
    radius: 30,
    description: "Родина человечества. Самое богатое разнообразие ресурсов.",
    gravity: 1.0,
    worldWidth: 250,
    worldDepth: 100,
    surfaceLevel: 25,
    temperature: 15,
    hasAtmosphere: true,
    resourceRichness: 1.0,
  },
  {
    name: "Mars",
    displayName: "Марс",
    color: 0xcd5c5c,
    accentColor: 0xe07878,
    radius: 25,
    description: "Красная планета. Оксид железа, водяной лёд, оливин.",
    gravity: 0.38,
    worldWidth: 200,
    worldDepth: 100,
    surfaceLevel: 25,
    temperature: -63,
    hasAtmosphere: false,
    resourceRichness: 0.7,
  },
  {
    name: "Jupiter",
    displayName: "Юпитер",
    color: 0xd8ca9d,
    accentColor: 0xe8daad,
    radius: 45,
    description: "Газовый гигант. Спутники богаты аммиаком и силикатами.",
    gravity: 2.53,
    worldWidth: 180,
    worldDepth: 90,
    surfaceLevel: 20,
    temperature: -145,
    hasAtmosphere: true,
    resourceRichness: 0.5,
  },
  {
    name: "Saturn",
    displayName: "Сатурн",
    color: 0xfad5a5,
    accentColor: 0xfae5c5,
    radius: 40,
    description: "Газовый гигант. Лёд Титана, углеводороды, азот.",
    gravity: 1.07,
    worldWidth: 180,
    worldDepth: 90,
    surfaceLevel: 20,
    temperature: -178,
    hasAtmosphere: true,
    resourceRichness: 0.5,
  },
];

export function getPlanetByName(name: string): PlanetData | undefined {
  return PLANETS.find(p => p.name === name);
}
