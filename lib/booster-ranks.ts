export type BoosterRank = "ROOKIE" | "BEGINNER" | "ADVANCED" | "EXPERT" | "PRO" | "ELITE";

export interface RankInfo {
  name: BoosterRank;
  color: string;
  minXp: number;
  icon: string;
}

export const BOOSTER_RANKS: RankInfo[] = [
  {
    name: "ROOKIE",
    color: "#b87333", // Bronze
    minXp: 0,
    icon: "military_tech",
  },
  {
    name: "BEGINNER",
    color: "#C0C0C0", // Silver
    minXp: 2500,
    icon: "workspace_premium",
  },
  {
    name: "ADVANCED",
    color: "#FFD700", // Gold
    minXp: 15000,
    icon: "stars",
  },
  {
    name: "EXPERT",
    color: "#22c55e", // Green
    minXp: 30000,
    icon: "psychology",
  },
  {
    name: "PRO",
    color: "#4B0082", // Indigo
    minXp: 75000,
    icon: "diamond",
  },
  {
    name: "ELITE",
    color: "#FF0000", // Red
    minXp: 200000,
    icon: "shield",
  },
];

export function calculateBoosterRank(xp: number): RankInfo {
  for (let i = BOOSTER_RANKS.length - 1; i >= 0; i--) {
    if (xp >= BOOSTER_RANKS[i].minXp) {
      return BOOSTER_RANKS[i];
    }
  }
  return BOOSTER_RANKS[0];
}
