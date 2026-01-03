export enum NenType {
  Enhancer = 'Reforço',
  Transmuter = 'Transformação',
  Emitter = 'Emissão',
  Conjurer = 'Materialização',
  Manipulator = 'Manipulação',
  Specialist = 'Especialização',
}

export interface Skill {
  id: string;
  name: string;
  category: string;
  type: string;
  cost: number;
  costType: string;
  damageDice?: string;
  damage?: string; // For summons
  attributeScaling?: string;
  description: string;
  imageUrl?: string;
}

export interface Item {
  id: string;
  name: string;
  quantity: number;
}

export interface Summon {
  id: string;
  name: string;
  avatarUrl?: string;
  type: string;
  currentHp: number;
  maxHp: number;
  currentNen: number;
  maxNen: number;
  attributes: Record<string, number>;
  description: string;
  skills: Skill[];
}

export interface Character {
  id: string;
  name: string;
  nickname: string;
  avatarUrl: string;
  age: number | string;
  nationality: string;
  height: string;
  weight: string;
  alignment: string;
  bio: string;
  hunterLevel: number;
  xp: number;
  maxXp: number;
  nenType: NenType;
  maxHp: number;
  currentHp: number;
  maxNen: number;
  currentNen: number;
  ca: number;
  attributes: Record<string, number>;
  attributeLabels: Record<string, string>;
  attributeMetadata: Record<string, { imageUrl?: string }>;
  equippedWeapon: {
    name: string;
    damage: string;
    description: string;
    powers: string;
    imageUrl?: string;
  };
  skills: Skill[];
  inventory: Item[];
  summons: Summon[];
  conditions: string[];
}