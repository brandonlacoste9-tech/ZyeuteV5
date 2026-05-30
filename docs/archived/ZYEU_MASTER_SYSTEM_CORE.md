# ⚜️ ZYEUTÉ V5 : RAPPORT MAÎTRE DU NOYAU SOUVERAIN

## Gouverneur Vocal & Orchestration de la Ruche (Phase 1 Complétée)

Ce document constitue la documentation officielle du système d'intelligence et d'action physique de Ti-Guy (Le Grand Castor).

---

## 🧠 1. ARCHITECTURE DE L'INTELLIGENCE (BRANCHE BORD EN BORD)

### 🛰️ Fournisseur Central : Google Vertex AI

- **Modèle Primaire**: `gemini-2.0-flash` (via Vercel AI SDK).
- **Financement**: Crédits Cloud ($1,300 + $813 Dialogflow).
- **Rôle**: Analyse d'intention, "Joualisation" phonétique et orchestration d'outils.

### 📚 Mémoire Infinie (Grounded Intelligence)

- **Moteur**: Vertex AI Search & Agent Builder.
- **Référence**: `zyeute_governance.md` (Data Store).
- **Capacité**: Réponses historiquement ancrées dans les lois de Zyeuté (Tolérance Zéro, Momentum Culturel).

---

## 🎙️ 2. ENDPOINTS DE COMMANDEMENT (API)

### 🟢 `POST /api/tiguy/voice`

- **Fonction**: Pipeline Vocal Principal (STT -> LLM -> TTS).
- **Mains actives**: Support du Tool-Calling (`zyeuteBrainTools`).
- **Paramètres**:
  - `audio`: Base64 (WebM/Opus).
  - `text`: Prompt alternatif (bypass STT).
- **Logique**: Exécution séquentielle (max 5 étapes) pour agir sur la DB avant de parler.

### 🟢 `POST /api/hive/event`

- **Fonction**: Passerelle de la Ruche (Inbound).
- **Secret**: `x-hive-secret` (Shared Secret).
- **Logique Proactive**:
  - **Priorité HAUTE**: Déclenche la "Joualisation" immédiate via Gemini + Annonce vocale forcée au frontend.
  - **Feedback Physique**: Active le stroboscope et les haptiques.

### 🟢 `POST /api/dialogflow/webhook`

- **Fonction**: Webhook pour Dialogflow CX (Enterprise Voice).
- **Intentions supportées**:
  - `expulser_troll`: Bannissement instantané via la voix.
  - `ajuster_momentum`: Boost algorithmique verbal.

---

## 📱 3. CAPACITÉS PHYSIQUES (FEEDBACK SOUVERAIN)

### 🎚️ Signature Haptique (Leather & Gold)

- **Module**: `physical-feedback.ts`.
- **Pattern**: `[100, 50, 200]` (Impact sec, frisson sourd).
- **Usage**: Accompagne chaque début de parole de Ti-Guy pour simuler une présence physique lourde.

### 🔦 Stroboscope Momentum

- **Visuel**: Overlay radial or/noir (10Hz).
- **Hardware**: Trigger flash caméra (selon compatibilité).
- **Usage**: Activé lors d'achievements ou de milestones critiques.

---

## 🛠️ 4. OUTILS DE GOUVERNANCE (THE BRAIN)

| Outil              | Description                              | Action DB             |
| :----------------- | :--------------------------------------- | :-------------------- |
| `expulser_troll`   | Bannissement permanent d'un utilisateur. | Role -> `banned`      |
| `ajuster_momentum` | Boost de visibilité pour une vidéo.      | score_multiplier += X |
| `validate_design`  | Analyse visuelle des couleurs/branding.  | Vision AI Analysis    |

---

## 🔒 5. SÉCURITÉ & PROTOCOLES

- **Authentification**: Validation par Bearer JWT (Supabase) + Secret Hive.
- **Quota Guard**: Bascule automatique entre Gemini 2.0 et DeepSeek en cas de dépassement.
- **Protection**: Ti-Guy refuse toute commande d'administration si l'utilisateur n'a pas le rôle `admin`.

---

**ÉTAT DU SYSTÈME : OPÉRATIONNEL ⚜️🦫**
_Branché sur le monde, enraciné ici._
