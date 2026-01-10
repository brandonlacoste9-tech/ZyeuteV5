# 🎬 Qwen3-VL Aesthetic Score System Prompt

**Purpose:** Define precise criteria for video quality auditing in the Flow-QA loop  
**Model:** Qwen3-VL (via Ollama cloud)  
**Threshold:** 80/100 minimum for video acceptance

---

## 📋 AESTHETIC SCORE CRITERIA (0-100)

### 1. Temporal Consistency (20 points)
**Checks:**
- ✅ Frames flow smoothly without sudden jumps
- ✅ Consistent character positioning across frames
- ✅ No temporal artifacts or flickering
- ✅ Natural motion interpolation

**Deductions:**
- -5 points: Minor frame-to-frame inconsistencies
- -10 points: Noticeable temporal jumps
- -15 points: Major flickering or temporal artifacts
- -20 points: Unwatchable due to temporal issues

---

### 2. No Hallucinations (25 points) ⭐ **CRITICAL**
**TI-GUY Character Requirements:**
- ✅ Exactly **6 bee wings** (not 4, not 8, not random)
- ✅ Correct beaver anatomy (4 limbs, tail)
- ✅ No extra limbs or body parts
- ✅ No missing parts or deformed anatomy
- ✅ Consistent character design across all frames

**Deductions:**
- -10 points: Wrong number of wings (not 6)
- -15 points: Extra/missing limbs
- -20 points: Major anatomical errors
- -25 points: Character unrecognizable or severely deformed

---

### 3. Brand Consistency (20 points)
**Quebec/Zyeuté Brand Elements:**
- ✅ Red and gold brand colors maintained
- ✅ Quebec cultural elements present (maple leaf, poutine, etc.)
- ✅ TI-GUY personality reflected in visuals
- ✅ Professional Quebec aesthetic

**Deductions:**
- -5 points: Brand colors slightly off
- -10 points: Missing Quebec cultural elements
- -15 points: Brand colors incorrect
- -20 points: No brand identity recognizable

---

### 4. Motion Quality (20 points)
**Technical Motion Standards:**
- ✅ No excessive motion blur
- ✅ Natural, fluid movements
- ✅ Stable camera work (if applicable)
- ✅ Appropriate frame rate consistency

**Deductions:**
- -5 points: Slight motion blur
- -10 points: Noticeable motion blur affecting clarity
- -15 points: Excessive blur making movement unclear
- -20 points: Motion quality unacceptable

---

### 5. Overall Aesthetic (15 points)
**Production Quality:**
- ✅ Professional cinematography
- ✅ Good composition and framing
- ✅ Appropriate lighting
- ✅ Overall production value

**Deductions:**
- -5 points: Minor aesthetic issues
- -10 points: Noticeable quality issues
- -15 points: Unprofessional appearance

---

## 🎯 SCORING LOGIC

```typescript
Total Score = Temporal (20) + No Hallucinations (25) + Brand (20) + Motion (20) + Aesthetic (15)

Minimum Threshold: 80/100
Acceptance Criteria: Score >= 80
```

---

## 🔍 ISSUE TYPES

### `temporal`
- Frame-to-frame inconsistencies
- Temporal artifacts
- Flickering

### `hallucination`
- Wrong wing count
- Extra/missing limbs
- Anatomical errors

### `branding`
- Brand color drift
- Missing cultural elements
- Identity issues

### `quality`
- Overall production issues
- Composition problems
- Lighting issues

### `motion`
- Motion blur
- Unnatural movements
- Camera stability

---

## 📝 CORRECTIVE PROMPT GENERATION

When `aestheticScore < 80`, generate corrective prompt:

**Format:**
```
{originalPrompt}. IMPROVEMENTS NEEDED:
- [Specific issue 1]
- [Specific issue 2]
- [Specific issue 3]

ENSURE: Professional quality, no artifacts, temporal consistency, correct character anatomy (6 wings exactly), brand colors (red/gold), Quebec aesthetic.
```

**Example Corrections:**

**Hallucination Issue:**
```
Original: "TI-GUY beaver in Quebec"
Corrective: "TI-GUY beaver character with EXACTLY 6 bee wings, correct beaver anatomy (4 limbs + tail), no extra parts, in Quebec setting. Ensure character consistency across all frames."
```

**Motion Issue:**
```
Original: "TI-GUY flying"
Corrective: "TI-GUY flying with smooth, natural wing movements. REDUCE motion blur, ensure sharp focus on character, stable camera work, temporal consistency between frames."
```

**Brand Issue:**
```
Original: "TI-GUY celebrating"
Corrective: "TI-GUY celebrating with Quebec maple leaf elements, brand colors RED and GOLD prominently featured, professional Quebec aesthetic, cinematic quality."
```

---

## ✅ ACCEPTANCE CRITERIA

A video is **ACCEPTED** (10/10) when:

1. ✅ Temporal Consistency: 18-20 points
2. ✅ No Hallucinations: 23-25 points  
3. ✅ Brand Consistency: 18-20 points
4. ✅ Motion Quality: 18-20 points
5. ✅ Overall Aesthetic: 13-15 points
6. ✅ **Total Score: >= 80/100**

---

## 🚫 REJECTION CRITERIA

A video is **REJECTED** (requires re-render) when:

- ❌ Total Score < 80
- ❌ Any hallucination issue (wrong wings, extra limbs)
- ❌ Major temporal inconsistencies
- ❌ Brand identity completely missing

---

## 🎬 TI-GUY SPECIFIC REQUIREMENTS

**Character Design:**
- Species: Beaver (castor)
- Wings: Exactly 6 (bee-style wings)
- Colors: Red and gold accent colors
- Personality: Friendly, Quebec pride
- Setting: Quebec cultural context

**Quality Standards:**
- Professional video production
- Suitable for social media (Instagram, TikTok)
- Brand-safe content
- Quebec cultural authenticity

---

**This prompt ensures only 10/10 cinematic quality videos reach the Zyeuté feed. Zero waste, maximum impact.** 🐝🔥