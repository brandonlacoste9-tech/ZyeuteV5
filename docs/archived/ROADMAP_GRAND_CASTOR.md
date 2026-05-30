# 🦫 Plan d'Implantation : Mise à Jour "Grand Castor" (Zyeuté V5)

Ce document détaille les étapes pour transformer Ti-Guy en Gouverneur Souverain de la plateforme Zyeuté.

---

## 🏗️ 1. Backend : GovernanceBee (L'Outil de Pouvoir)

Nous allons créer une nouvelle "Bee" spécialisée dans la gestion de la cité.

### Logic (French/Joual)

- **Fichier** : `backend/ai/bees/governance-bee.ts`
- **Actions** :
  - `analyser_qualite_video` : Utilise Gemini 1.5 Pro pour juger si une vidéo est "Souveraine" ou "Médiocre".
  - `ajuster_momentum` : Modifie le `viral_score` et injecte des `reactions_count` (Fires) dans la base de données.
  - `expulser_troll` : Bannit un utilisateur si son contenu est toxique.

### SQL Integration

- Utilisation de `drizzle-orm` pour mettre à jour la table `publications`.
- Incrémentation massive du `viral_score` pour les vidéos choisies.

---

## 🎨 2. Frontend : Les Choix du Grand Castor

Une nouvelle section de luxe dans le feed continu.

### Design System "Souverain"

- **Background** : Effet cuir noir texturé (`leather-bg`).
- **Accents** : Or métallique (`#D4AF37`) et typographie sérif haut de gamme.
- **Micro-animations** : Apparition fluide avec un éclat doré.

### Composant React

- **Fichier** : `frontend/src/components/features/ChoixDuGrandCastor.tsx`
- **Fonctionnalité** : Affiche les 3 vidéos ayant le plus haut `viral_score` attribué par Ti-Guy.

---

## 🧠 3. Intelligence Gouvernementale (System Prompt)

Mise à jour de l'orchestrateur pour inclure les nouveaux outils.

- **Identité** : Le "Grand Castor" n'est plus un simple assistant, c'est l'arbitre de l'élégance et de la sécurité.
- **Langue** : Joual authentique pour toutes les interactions de gouvernance.

---

## 📅 Échéancier

1. **Scaffold backend** : Création de `governance-bee.ts`.
2. **Database functions** : Ajout des helpers SQL pour l'injection de momentum.
3. **UI/UX Design** : Création du composant "Souverain" en CSS/React.
4. **Intégration finale** : Connexion de l'orchestrateur aux nouveaux outils.

**Approuvez-vous ce plan pour que je commence le codage?** ⚜️
