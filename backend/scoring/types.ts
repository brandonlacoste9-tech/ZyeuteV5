export interface CulturalMomentum {
  postId: string;
  staticScore: number; // The original quebec_score
  soulScore: number; // Calculated from engagement
  recencyBias: number; // Decay factor
  finalRank: number;
}
