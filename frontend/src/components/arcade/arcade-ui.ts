/** Shared Voyageur arcade class strings — keep surfaces consistent. */

export const arcadeCard =
  "leather-card stitched rounded-2xl border border-gold-500/20";

export const arcadeCardElevated =
  "leather-card-elevated stitched rounded-2xl border border-gold-500/30 gold-glow";

export const arcadeBtnPrimary =
  "w-full py-4 rounded-2xl bg-gold-500 text-black font-black uppercase tracking-wider hover:bg-gold-400 transition-colors duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed";

export const arcadeBtnSecondary =
  "w-full py-4 rounded-2xl border-2 border-gold-500/50 text-gold-400 font-black uppercase tracking-wider hover:bg-gold-500/10 transition-colors duration-200 cursor-pointer disabled:opacity-50";

export const arcadeBtnGhost =
  "w-full py-3 rounded-2xl border border-leather-600 text-leather-200 font-bold uppercase tracking-wider text-sm hover:border-gold-500/40 transition-colors duration-200 cursor-pointer disabled:opacity-50";

export const arcadeChoiceBtn = (selected: boolean) =>
  `w-full text-left p-4 min-h-[52px] rounded-xl border transition-colors duration-200 cursor-pointer ${
    selected
      ? "border-gold-500 bg-gold-500/15 text-gold-100"
      : "border-leather-700 bg-leather-900/50 hover:border-gold-500/40 text-white"
  }`;

export const arcadeTokenChip =
  "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gold-500/10 border border-gold-500/30 text-gold-300 text-sm font-bold tabular-nums";
