# 💬 Messagerie Zyeuté

> **La messagerie sécurisée 100% Québécoise**  
> Thème Cuir & Or avec surpiqures | Style Louis Vuitton x Québec

![Zyeuté Chat Preview](https://via.placeholder.com/800x400/2b1f17/d4af37?text=Zyeuté+Messenger)

## ✨ Fonctionnalités

### 🔒 **Messages Sécurisés (Chiffrement)**
```
Clique sur le cadenas 🔓 pour activer le mode sécurisé

• Messages chiffrés côté client
• Base64 + obfuscation
• Indicateur vert "🔒 Sécurisé"
• Clique sur le message pour lire
```

### ⏱️ **Messages Éphémères (Auto-destruction)**
```
Clique sur le timer ⏱️ pour régler:

• 10 secondes  - Flash rapide
• 1 minute     - Message court
• 5 minutes    - Discussion rapide
• 1 heure      - Session de travail
• 24 heures    - Nettoyage quotidien

Le message disparaît automatiquement!
```

### 📹 **Appels Vidéo & Audio**
```
📹 Appel vidéo  |  📞 Appel audio

• Interface plein écran
• Avatar animé de Ti-Guy
• Indicateur "En ligne"
• Bouton raccrocher (rouge)

Prêt pour WebRTC (signalisation à ajouter)
```

### 🔍 **Recherche de Messages**
```
Clique sur 🔍 et tape ton recherche

• Recherche en temps réel
• Compteur de résultats
• Highlight des messages
• Fermeture avec X
```

### 🎭 **Réactions aux Messages**
```
Survole un message pour voir:

❤️ 👍 😂 😮 🎉 🔥 👏 🦫 ⚜️

• Clique pour réagir
• Compteur de réactions
• Plusieurs réactions possibles
```

### 😀 **Emoji Picker**
```
Clique sur 😀 pour ouvrir:

• Smileys récents
• Smileys classiques
• Cœurs
• Spécial Québec (⚜️ 🦫 🏒 🍁)
```

### 👥 **Groupes de Discussion**
```
Onglet "Groupes" pour voir:

• 🏒 Les Habs Fans
• 🍁 Québec Pride  
• 💻 Dev Team

• Compteur de membres
• Indication "en ligne"
• Notifications de messages
```

## 🚀 Utilisation

### Installation
```tsx
import { ChatZyeute } from "@/components/chat";

function App() {
  const [ouvert, setOuvert] = useState(false);

  return (
    <>
      <button onClick={() => setOuvert(true)}>
        Ouvrir la messagerie
      </button>
      
      {ouvert && (
        <ChatZyeute onClose={() => setOuvert(false)} />
      )}
    </>
  );
}
```

### Ou remplace ton ancien chat
```tsx
// Remplace:
// <ChatModal onClose={...} />
// ou
// <ChatInterface onClose={...} />

// Par:
<ChatZyeute onClose={() => setOuvert(false)} />
```

## 🎨 Design System

### Couleurs
```css
Or principal:     #d4af37
Or clair:         #f4e5c3
Or foncé:         #b8860b

Cuir foncé:       #2b1f17
Cuir moyen:       #3a2820
Cuir clair:       #e8dcc8

Violet (user):    #7c3aed
Ambre (Ti-Guy):   #d97706
Vert (sécurisé):  #22c55e
Rouge (alerte):   #ef4444
```

### Typographie
```
Titres:    'Playfair Display', serif
Corps:     'Inter', sans-serif
```

### Éléments visuels
- Bordures dorées avec effet surpiqûre
- Pattern Fleur-de-lis subtil
- Ombres portées douces
- Coins arrondis (rounded-2xl)
- Animations fluides

## 🔒 Sécurité

### Chiffrement Actuel (Démo)
```typescript
// Base64 + obfuscation simple
// Pour production: utiliser OpenPGP.js ou WebCrypto
```

### Recommandation Production
```typescript
import * as openpgp from 'openpgp';

// Chiffrement
const chiffre = await openpgp.encrypt({
  message: await openpgp.createMessage({ text }),
  encryptionKeys: clePublique,
});

// Déchiffrement
const dechiffre = await openpgp.decrypt({
  message: await openpgp.readMessage({ encrypted }),
  decryptionKeys: clePrivee,
});
```

## 📱 Compatibilité

| Navigateur | Support |
|------------|---------|
| Chrome     | ✅ 90+  |
| Firefox    | ✅ 88+  |
| Safari     | ✅ 14+  |
| Edge       | ✅ 90+  |

**Requis:**
- HTTPS pour microphone/caméra
- Permissions utilisateur
- JavaScript activé

## 🗂️ Structure

```
frontend/src/components/chat/
├── ChatZyeute.tsx      # Composant principal (100% Québécois)
├── index.ts            # Export
└── 
CHAT_ZYEUTE_README.md   # Cette documentation
```

## 🎯 Points Forts

1. **100% Français** - Interface entièrement en français
2. **Style Québec** - Emojis locaux (🦫 ⚜️ 🏒)
3. **Sécurisé** - Option chiffrement intégrée
4. **Éphémère** - Messages auto-destructibles
5. **Appels** - Vidéo et audio prêts
6. **Réactions** - Expressions québécoises
7. **Groupes** - Communautés thématiques

## 📝 À Faire (TODO)

### Prioritaire
- [ ] Connecter vraie API de traduction
- [ ] Implémenter OpenPGP pour chiffrement fort
- [ ] Ajouter serveur de signalisation WebRTC
- [ ] Backend pour persistance messages

### Futur
- [ ] Stories éphémères (24h)
- [ ] Partage de localisation
- [ ] Paiements entre utilisateurs
- [ ] Mode sombre/clair
- [ ] Swipe gestures (mobile)

## 🦫 Ti-Guy

Ton assistant IA parle en **joual québécois** authentique:
- "Ayoye!"
- "Chus là pour toé"
- "Tabarnak c'est cool"
- "Sti c'est beau"

## 🎉 Essaye-le!

1. **Ouvre la messagerie**
2. **Active le mode sécurisé** 🔒
3. **Envoie un message éphémère** ⏱️
4. **Ajoute une réaction** ❤️
5. **Lance un appel vidéo** 📹

---

**Zyeuté** - Le réseau social du Québec numérique ⚜️🇨🇦

*Fait avec ❤️ (et un peu de sirop d'érable)*
