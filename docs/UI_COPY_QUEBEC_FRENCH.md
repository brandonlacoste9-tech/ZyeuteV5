# UI Copy : Québec French (pour Claude)

**Ready-to-copy** strings for the app. Everything is in **français québécois**, matches existing app wording, and uses the agreed tone (casual, concise, « tu »).

Use this doc when adding or changing any user-facing text. Drop the JSON into your i18n file or adapt to your format.

---

## 1. Global strings (déjà dans l’app)

| Clé | Québec French (déjà en place) | Commentaire |
|-----|------------------------------|--------------|
| `btn_follow` | **Suivre** | Bouton / action « suivre » un compte |
| `btn_unfollow` | **Ne plus suivre** | Option inverse |
| `btn_like` | **Feux** | Le « like » du style TikTok |
| `msg_connection_error` | **Vérifie ta connexion** | Toast / alerte réseau |
| `msg_video_unavailable` | **Vidéo non disponible** | Message d’erreur du lecteur |
| `lbl_comments` | **Commentaires** | Titres des sections de commentaires |
| `lbl_share` | **Partager** | Bouton de partage |
| `lbl_save` | **Enregistrer** | Bouton pour sauvegarder/ajouter à la bibliothèque |
| `lbl_add` | **Ajouter** | Variante lorsqu’on ajoute à une collection |

**NOTE** – Tous les nouveaux textes doivent **imiter** le style ci‑dessus : deux mots max quand possible, verbe à l’infinitif, ton familier, pas de majuscules sauf au début d’une phrase ou d’un nom propre.

---

## 2. TikTok-style social features (section 5)

### 2.1 Boutons principaux

```json
{
  "btn_follow": "Suivre",
  "btn_following": "Abonné·e(s)",
  "btn_unfollow": "Ne plus suivre",
  "btn_like": "Feux",
  "btn_comment": "Commenter",
  "btn_share": "Partager",
  "btn_save": "Enregistrer",
  "btn_add": "Ajouter"
}
```

### 2.2 Labels & champs de texte

```json
{
  "lbl_comments": "Commentaires",
  "lbl_write_comment": "Écris un commentaire…",
  "lbl_post_comment": "Envoyer",
  "lbl_views": "Vues",
  "lbl_likes": "Feux",
  "lbl_followers": "Abonnés",
  "lbl_following": "Abonnements",
  "lbl_recent_videos": "Vidéos récentes",
  "lbl_profile": "Profil",
  "lbl_settings": "Paramètres"
}
```

### 2.3 Toasts / notifications (à afficher brièvement)

| Situation | Message Québec French | Variables |
|-----------|------------------------|-----------|
| Vidéo ajoutée à la collection | **Vidéo enregistrée** | — |
| Vidéo partagée | **Partage lancé** | — |
| Suivi d’un compte | **Tu suis {username}** | `{username}` |
| Arrêt du suivi | **Tu ne suis plus {username}** | `{username}` |
| Commentaire posté | **Commentaire publié** | — |
| Erreur réseau (générique) | **Impossible de se connecter. Vérifie ta connexion** | — |
| Erreur d’envoi de commentaire | **Le commentaire n’a pas pu être envoyé** | — |
| Erreur d’ajout de vidéo | **Impossible d’enregistrer la vidéo** | — |
| Chargement du flux | **Chargement…** | — |
| Vidéo en cours de lecture | **Lecture en cours** | — |

```json
{
  "toast_video_saved": "Vidéo enregistrée",
  "toast_share_started": "Partage lancé",
  "toast_followed": "Tu suis {username}",
  "toast_unfollowed": "Tu ne suis plus {username}",
  "toast_comment_posted": "Commentaire publié",
  "toast_network_error": "Impossible de se connecter. Vérifie ta connexion",
  "toast_comment_error": "Le commentaire n’a pas pu être envoyé",
  "toast_save_error": "Impossible d’enregistrer la vidéo",
  "toast_loading": "Chargement…",
  "toast_playing": "Lecture en cours"
}
```

### 2.4 Messages d’erreur (dialogues / bandeaux)

```json
{
  "error_video_unavailable": "Vidéo non disponible",
  "error_cannot_load_comments": "Les commentaires n’ont pas pu être chargés",
  "error_not_logged_in": "Connecte‑toi pour interagir",
  "error_action_not_allowed": "Cette action n’est pas permise"
}
```

### 2.5 Placeholders / variables

| Clé | Exemple d’usage | Remarque |
|-----|------------------|----------|
| `{username}` | « Jean‑Claude » | Nom d’utilisateur ; toujours en « tu » pour le texte qui s’adresse à l’utilisateur. |
| `{count}` | 123 | Remplace avec le nombre de vues, feux, abonnés, etc. |
| `{duration}` | 02:15 | Durée de la vidéo (mm:ss). |
| `{timeAgo}` | « il y a 3 h » | Formattage de temps relatif (moment‑js ou équivalent). |

---

## 3. Règles de rédaction (mini style guide)

| Règle | Exemple | Pourquoi |
|-------|---------|----------|
| **Toujours utiliser le « tu »** | « Tu suis », « Vérifie ta connexion » | Ton familier, typique du Québec. |
| **Pas de mots anglais** | « Share » → « Partager » | Conformité avec la consigne langue. |
| **Éviter le français « international »** | « Enregistrer » (pas « Sauvegarder ») | Aligné avec les termes déjà présents dans l’app. |
| **Pas de majuscules inutiles** | « Feux », « Suivre » (première lettre seulement) | Cohérence visuelle. |
| **Utiliser les accents** | « Échec », « Vérifie », « À propos » | Respect de l’orthographe québécoise. |
| **Pluralisation** | Libellé fixe reste **Feux** ; si besoin de « 1 feu » / « 2 feux », utiliser une clé séparée (`like_singular` / `like_plural`). | Le libellé affiché reste *Feux* ; comptes dynamiques à part. |
| **Ponctuation** | Ajouter un point uniquement si la phrase est complète (toast / dialogues). | Ex. : « Impossible de se connecter. Vérifie ta connexion. » |
| **Abréviations** | Éviter sauf si largement reconnues (ex. « min » pour minutes). | Clarté. |

---

## 4. Exemple d’intégration (React / i18n)

```json
// i18n/fr-CA.json ou équivalent
{
  "btn_follow": "Suivre",
  "btn_unfollow": "Ne plus suivre",
  "btn_like": "Feux",
  "btn_share": "Partager",
  "btn_save": "Enregistrer",
  "lbl_comments": "Commentaires",
  "lbl_write_comment": "Écris un commentaire…",
  "lbl_post_comment": "Envoyer",
  "toast_video_saved": "Vidéo enregistrée",
  "toast_share_started": "Partage lancé",
  "toast_followed": "Tu suis {username}",
  "toast_unfollowed": "Tu ne suis plus {username}",
  "error_video_unavailable": "Vidéo non disponible"
}
```

```tsx
// Exemple d’usage (React)
<button>{t('btn_follow')}</button>
toast(t('toast_followed', { username: user.name }));
```

**À retenir :** Chaque nouveau libellé doit passer par ce fichier (ou le même jeu de clés) pour garder toute la UI **uniforme en français québécois**.

---

## 5. How the i18n System Works

### Current Implementation
**File**: `frontend/src/i18n/index.ts` (115 lines)

The app uses a **custom translation hook**, NOT react-i18next. This is simpler for the Quebec-focused approach.

### Architecture
```typescript
// Translation map structure
const TRANSLATIONS: Record<string, Record<string, string>> = {
  "fr-CA": { /* Quebec French */ },
  "pt-BR": { /* Brazilian Portuguese */ },
  "es-AR": { /* Argentine Spanish */ },
  "es-MX": { /* Mexican Spanish */ },
};

// Hook returns t() function and current locale
export function useTranslation() {
  const locale = AppConfig.identity.locale; // from factory.ts
  const t = (key: string) => {
    return TRANSLATIONS[locale]?.[key] || TRANSLATIONS["fr-CA"][key] || key;
  };
  return { t, locale };
}
```

### Adding New Strings: 3-Step Process

**Step 1**: Add to TRANSLATIONS in `frontend/src/i18n/index.ts`
```typescript
"fr-CA": {
  "btn_save": "Enregistrer",
  "toast_video_saved": "Vidéo enregistrée",
  // ... existing keys
}
```

**Step 2**: Add to this doc (`UI_COPY_QUEBEC_FRENCH.md`)
```json
{
  "btn_save": "Enregistrer",
  "toast_video_saved": "Vidéo enregistrée"
}
```

**Step 3**: Use in component
```tsx
const { t } = useTranslation();
<button>{t('btn_save')}</button>
```

### Variable Substitution
**NOT supported** in the current system. For dynamic values, use template literals:

```tsx
// Current approach (manual):
const username = "Jean";
const message = `Tu suis ${username}`; // "Tu suis Jean"

// Future enhancement: Support interpolation in i18n
// t('toast_followed', { username: 'Jean' }) → "Tu suis Jean"
```

---

## 6. Complete String Inventory

### ✅ Strings Already in Code (`i18n/index.ts`)

**Navigation** (5 strings):
- `nav.feed`: "Fil d'actualité"
- `nav.explore`: "Explorer"
- `nav.stories`: "Histoires"
- `nav.notifications`: "Notifications"
- `nav.profile`: "Mon Profil"

**Authentication** (3 strings):
- `auth.login`: "Se connecter"
- `auth.signup`: "S'inscrire"
- `auth.logout`: "Déconnexion"

**Actions** (3 strings):
- `action.share`: "Partager"
- `action.comment`: "Commenter"
- `action.gift`: "Offrir un cadeau"

### ❌ Strings MISSING from Code (Need to Add)

These are documented in §2 above but **NOT** in `i18n/index.ts`:

**Missing Button Labels** - Add to TRANSLATIONS:
```json
{
  "btn_follow": "Suivre",
  "btn_following": "Abonné·e(s)",
  "btn_unfollow": "Ne plus suivre",
  "btn_like": "Feux",
  "btn_save": "Enregistrer",
  "btn_add": "Ajouter"
}
```

**Missing Toasts** - Add to TRANSLATIONS:
```json
{
  "toast_video_saved": "Vidéo enregistrée",
  "toast_share_started": "Partage lancé",
  "toast_comment_posted": "Commentaire publié",
  "toast_network_error": "Impossible de se connecter. Vérifie ta connexion",
  "toast_comment_error": "Le commentaire n'a pas pu être envoyé",
  "toast_save_error": "Impossible d'enregistrer la vidéo"
}
```

**Action Item**: Create a PR to sync all strings from this doc into `frontend/src/i18n/index.ts`.

---

## 7. Real Component Examples

### VideoCard Action Bar (Complete Example)

**File**: `frontend/src/components/features/VideoCard.tsx`

```tsx
import { useTranslation } from '@/i18n';
import { toast } from '@/components/Toast';

export const VideoCard: React.FC<Props> = ({ post }) => {
  const { t } = useTranslation();

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.share({
        title: post.caption || 'Video',
        url: window.location.origin + `/video/${post.id}`
      });
      toast(t('toast_share_started')); // "Partage lancé"
    } catch (error) {
      // User cancelled or not supported
    }
  };

  return (
    <div className="actions-bar flex gap-4 p-4">
      {/* Fire (Like) */}
      <button onClick={handleFire}>
        <FireIcon className="h-7 w-7" />
        <span>{t('btn_like')}</span>         {/* "Feux" */}
        <span className="count">{fireCount}</span>
      </button>

      {/* Comment */}
      <button onClick={handleComment}>
        <CommentIcon className="h-7 w-7" />
        <span>{t('action.comment')}</span>   {/* "Commenter" */}
        <span className="count">{commentCount}</span>
      </button>

      {/* Share */}
      <button onClick={handleShare}>
        <ShareIcon className="h-7 w-7" />
        <span>{t('action.share')}</span>     {/* "Partager" */}
      </button>
    </div>
  );
};
```

### Toast Notification Example

```tsx
import { toast } from '@/components/Toast';
import { useTranslation } from '@/i18n';

const { t } = useTranslation();

// Success toast
toast(t('toast_video_saved')); // "Vidéo enregistrée"

// Error toast with dynamic value (manual template)
const username = post.user.username;
toast(`Tu suis ${username}`); // For now, use template literal

// Generic error
toast(t('toast_network_error')); // "Impossible de se connecter. Vérifie ta connexion"
```

---

## 8. À remettre à Claude

1. Copier-coller les blocs JSON (ou le format .properties utilisé) dans le projet.
2. Intégrer dans le système de localisation (i18n) existant.
3. Utiliser les variables `{username}`, `{count}`, etc. où nécessaire.
4. Respecter les règles du mini style guide pour toute nouvelle chaîne.

---

**Référence :** `docs/HANDOVER_VIDEO_AND_DEPLOY.md` §0 (Language — Quebec French) et §5 (TikTok-style social features).  
**Dernière mise à jour :** 2026-02-05
