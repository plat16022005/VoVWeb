export interface CharacterSkill {
  name: string;
  type: string;
  desc: string;
}

export interface Character {
  id: string; // maps to HeroId
  name: string; // maps to HeroName
  title: string;
  element?: string;
  elementColor?: string;
  path?: string;
  role?: string; // "Archer" | "Warrior" | "Mage" | "Tank" | "Support" | "Healer" | "Assassin"
  rarity: number; // 3 (R), 4 (SR), 5 (SSR / UR)
  rarityLabel?: string; // "R" | "SR" | "SSR" | "UR"
  cv: string;
  image: string;
  quote: string;
  lore: string;
  skills: CharacterSkill[];

  // Combat Stats (matching Firestore HeroConfigs)
  baseHp?: number; // BaseHp
  baseAtk?: number; // BaseAtk
  baseDef?: number; // BaseDef
  baseSpd?: number; // BaseSpeed
  critRate?: number; // BaseCritRate (%)
  critDmg?: number; // BaseCritDamage (%)
  baseDodgeRate?: number; // BaseDodgeRate (%)
  baseParryRate?: number; // BaseParryRate (%)
  maxRage?: number; // MaxRage

  // Stat Growth per Level (matching Firestore HeroConfigs)
  hpGrowthPerLevel?: number; // HpGrowthPerLevel
  atkGrowthPerLevel?: number; // AtkGrowthPerLevel
  defGrowthPerLevel?: number; // DefGrowthPerLevel

  status?: "Active" | "Testing" | "Hidden";
  releaseVersion?: string;
  createdAt?: number;
  updatedAt?: number;
}

export const CHARACTERS: Character[] = [];
