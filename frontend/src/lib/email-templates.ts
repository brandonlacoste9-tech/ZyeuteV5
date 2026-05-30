/**
 * Zyeuté Email Templates - Joual-forward, warm, authentic Quebec voice
 *
 * Voice guidelines (matching copy.ts):
 * - Use "tu" (informal) over "vous"
 * - Joual expressions: icitte, ben, faque, pis, là-là
 * - Warm and encouraging
 * - Inclusive - no gendered assumptions
 * - Ti-Guy personality throughout
 */

export interface EmailTemplate {
  subject: string;
  preheader: string;
  body: string;
  cta?: {
    text: string;
    url: string;
  };
}

export type EmailType =
  | "welcome"
  | "onboarding_day1"
  | "onboarding_day3"
  | "onboarding_day7"
  | "weekly_digest"
  | "upgrade_prompt"
  | "reengagement";

// Base email template with Quebec heritage styling
export const emailStyles = {
  container: `
    max-width: 600px;
    margin: 0 auto;
    font-family: 'Inter', -apple-system, sans-serif;
    background: linear-gradient(180deg, #1a1a1a 0%, #0d0d0d 100%);
    color: #e5e5e5;
    border-radius: 16px;
    overflow: hidden;
  `,
  header: `
    background: linear-gradient(135deg, #3B1E3D 0%, #5A2A4A 100%);
    padding: 32px;
    text-align: center;
    border-bottom: 2px dashed #FFBF00;
  `,
  logo: `
    font-size: 32px;
    font-weight: 800;
    color: #FFBF00;
    text-shadow: 0 0 20px rgba(255, 191, 0, 0.5);
    letter-spacing: -0.02em;
  `,
  body: `
    padding: 32px;
    line-height: 1.7;
  `,
  tiguy: `
    font-size: 48px;
    text-align: center;
    margin: 16px 0;
  `,
  heading: `
    font-size: 24px;
    font-weight: 700;
    color: #FFBF00;
    margin-bottom: 16px;
  `,
  paragraph: `
    font-size: 16px;
    color: #d4d4d4;
    margin-bottom: 16px;
  `,
  cta: `
    display: inline-block;
    background: linear-gradient(135deg, #FFBF00 0%, #FFD700 100%);
    color: #000;
    font-weight: 700;
    padding: 16px 32px;
    border-radius: 12px;
    text-decoration: none;
    margin: 24px 0;
    box-shadow: 0 0 20px rgba(255, 191, 0, 0.3);
  `,
  footer: `
    padding: 24px;
    text-align: center;
    border-top: 1px solid #333;
    font-size: 12px;
    color: #737373;
  `,
  highlight: `
    color: #FFBF00;
    font-weight: 600;
  `,
  card: `
    background: #1f1f1f;
    border: 1px solid #333;
    border-radius: 12px;
    padding: 20px;
    margin: 16px 0;
  `,
};

// Welcome email - First impression, warm and inviting
export const welcomeEmail = (username: string): EmailTemplate => ({
  subject: `Bienvenue dans la gang, ${username}! 🦫🔥`,
  preheader: "Ti-Guy t'accueille dans la communauté Zyeuté",
  body: `
    <div style="${emailStyles.tiguy}">🦫</div>
    <h1 style="${emailStyles.heading}">Allô ${username}!</h1>
    <p style="${emailStyles.paragraph}">
      C'est Ti-Guy! Content que tu sois là!
    </p>
    <p style="${emailStyles.paragraph}">
      Zyeuté, c'est <span style="${emailStyles.highlight}">l'app sociale du Québec</span>. 
      Icitte, on partage nos moments, on découvre du monde de partout au Québec, 
      pis on se donne des 🔥 au lieu des likes.
    </p>
    <p style="${emailStyles.paragraph}">
      T'as accès à plein d'affaires cool:
    </p>
    <div style="${emailStyles.card}">
      <p style="margin: 8px 0;">🔥 <strong>Les Feux</strong> - Notre façon unique de réagir</p>
      <p style="margin: 8px 0;">🎨 <strong>Ti-Guy Studio</strong> - Crée des images avec l'IA</p>
      <p style="margin: 8px 0;">📱 <strong>La Zyeute</strong> - Feed vertical style TikTok</p>
      <p style="margin: 8px 0;">⚜️ <strong>100% Québec</strong> - Fait icitte, pour icitte</p>
    </div>
    <p style="${emailStyles.paragraph}">
      Viens faire un tour, on t'attend! 🦫⚜️
    </p>
  `,
  cta: {
    text: "Commence à zyeuter →",
    url: "{{APP_URL}}/",
  },
});

// Onboarding Day 1 - Ti-Guy Studio intro
export const onboardingDay1Email = (username: string): EmailTemplate => ({
  subject: `${username}, as-tu essayé Ti-Guy Studio? 🎨`,
  preheader: "Crée des images avec l'IA - c'est gratuit pour commencer!",
  body: `
    <div style="${emailStyles.tiguy}">🎨</div>
    <h1 style="${emailStyles.heading}">Hey ${username}!</h1>
    <p style="${emailStyles.paragraph}">
      J'espère que tu t'installes ben! Aujourd'hui, je voulais te parler de 
      <span style="${emailStyles.highlight}">Ti-Guy Studio</span>.
    </p>
    <p style="${emailStyles.paragraph}">
      C'est mon petit coin création où tu peux faire des images avec l'intelligence artificielle. 
      Tu décris ce que tu veux, pis pouf! 💫 Une image apparaît.
    </p>
    <div style="${emailStyles.card}">
      <p style="margin: 8px 0;"><strong>Comment ça marche:</strong></p>
      <p style="margin: 8px 0;">1️⃣ Va dans Studio</p>
      <p style="margin: 8px 0;">2️⃣ Décris ton idée (en français!)</p>
      <p style="margin: 8px 0;">3️⃣ Clique "Générer"</p>
      <p style="margin: 8px 0;">4️⃣ Partage sur ton profil!</p>
    </div>
    <p style="${emailStyles.paragraph}">
      T'as des crédits gratuits pour essayer. Vas-y, amuse-toi! 🦫
    </p>
  `,
  cta: {
    text: "Essayer Ti-Guy Studio →",
    url: "{{APP_URL}}/ai-studio",
  },
});

// Onboarding Day 3 - Fire reactions + engagement
export const onboardingDay3Email = (username: string): EmailTemplate => ({
  subject: `🔥 Comment les feux marchent sur Zyeuté`,
  preheader: "Notre système unique de réactions québécoises",
  body: `
    <div style="${emailStyles.tiguy}">🔥</div>
    <h1 style="${emailStyles.heading}">Salut ${username}!</h1>
    <p style="${emailStyles.paragraph}">
      T'as peut-être remarqué qu'on a pas de "likes" icitte. 
      À place, on donne des <span style="${emailStyles.highlight}">🔥 Feux</span>!
    </p>
    <p style="${emailStyles.paragraph}">
      Pourquoi des feux? Ben, au Québec, on dit souvent "c'est en feu" 
      quand quelque chose est vraiment hot! Faque c'était parfait pour Zyeuté.
    </p>
    <div style="${emailStyles.card}">
      <p style="margin: 8px 0;"><strong>Le savais-tu?</strong></p>
      <p style="margin: 8px 0;">• Plus tu donnes de feux, plus ton score monte</p>
      <p style="margin: 8px 0;">• Les posts avec beaucoup de feux sont mis en avant</p>
      <p style="margin: 8px 0;">• Ton "Fire Score" montre ton niveau d'engagement</p>
    </div>
    <p style="${emailStyles.paragraph}">
      Faque, vas-y! Donne des feux au monde! 🔥🔥🔥
    </p>
  `,
  cta: {
    text: "Découvrir du contenu →",
    url: "{{APP_URL}}/explore",
  },
});

// Onboarding Day 7 - Premium upgrade soft pitch
export const onboardingDay7Email = (username: string): EmailTemplate => ({
  subject: `Une semaine sur Zyeuté! 🎉 Merci ${username}`,
  preheader: "On a un petit cadeau pour toi...",
  body: `
    <div style="${emailStyles.tiguy}">🎉</div>
    <h1 style="${emailStyles.heading}">Ça fait déjà une semaine!</h1>
    <p style="${emailStyles.paragraph}">
      Hey ${username}, ça fait une semaine que t'es avec nous autres! 
      Merci d'être là 🧡
    </p>
    <p style="${emailStyles.paragraph}">
      Tu t'es peut-être demandé c'est quoi les badges 
      <span style="${emailStyles.highlight}">VIP</span> que certains ont...
    </p>
    <div style="${emailStyles.card}">
      <p style="margin: 8px 0;"><strong>Zyeuté Premium, c'est:</strong></p>
      <p style="margin: 8px 0;">🥉 <strong>Bronze</strong> - 4.99$/mois - Plus de créations AI</p>
      <p style="margin: 8px 0;">🥈 <strong>Argent</strong> - 9.99$/mois - Vidéos AI + badge vérifié</p>
      <p style="margin: 8px 0;">🥇 <strong>Or</strong> - 19.99$/mois - Tout illimité + support VIP</p>
    </div>
    <p style="${emailStyles.paragraph}">
      C'est pas obligatoire, mais si t'aimes l'app pis tu veux nous supporter, 
      c'est une belle façon! 🦫⚜️
    </p>
  `,
  cta: {
    text: "Voir les plans Premium →",
    url: "{{APP_URL}}/premium",
  },
});

// Weekly digest - Activity summary + content suggestions
export const weeklyDigestEmail = (
  username: string,
  stats: {
    firesReceived: number;
    firesGiven: number;
    newFollowers: number;
    postsCreated: number;
  },
  suggestedUsers: string[],
): EmailTemplate => ({
  subject: `Ta semaine sur Zyeuté, ${username} 📊`,
  preheader: `${stats.firesReceived} feux reçus cette semaine!`,
  body: `
    <div style="${emailStyles.tiguy}">📊</div>
    <h1 style="${emailStyles.heading}">Ta semaine en résumé</h1>
    <p style="${emailStyles.paragraph}">
      Salut ${username}! Voici ce qui s'est passé pour toi cette semaine:
    </p>
    <div style="${emailStyles.card}">
      <p style="margin: 8px 0;">🔥 <strong>${stats.firesReceived}</strong> feux reçus</p>
      <p style="margin: 8px 0;">💛 <strong>${stats.firesGiven}</strong> feux donnés</p>
      <p style="margin: 8px 0;">👥 <strong>${stats.newFollowers}</strong> nouvelles personnes te suivent</p>
      <p style="margin: 8px 0;">📸 <strong>${stats.postsCreated}</strong> posts créés</p>
    </div>
    ${
      stats.firesReceived > 0
        ? `
      <p style="${emailStyles.paragraph}">
        Ton contenu fait réagir du monde! Continue comme ça! 🔥
      </p>
    `
        : `
      <p style="${emailStyles.paragraph}">
        C'est tranquille cette semaine, mais ça va venir! 
        Essaie de poster quelque chose de ton coin du Québec!
      </p>
    `
    }
    ${
      suggestedUsers.length > 0
        ? `
      <div style="${emailStyles.card}">
        <p style="margin: 8px 0;"><strong>Du monde à découvrir:</strong></p>
        ${suggestedUsers.map((u) => `<p style="margin: 4px 0;">• @${u}</p>`).join("")}
      </div>
    `
        : ""
    }
  `,
  cta: {
    text: "Voir ton profil →",
    url: "{{APP_URL}}/profile",
  },
});

// Upgrade prompt - Creator Pro pitch
export const upgradePromptEmail = (
  username: string,
  aiGenerationsUsed: number,
  maxFreeGenerations: number,
): EmailTemplate => ({
  subject: `${username}, débloque Ti-Guy Studio Pro! 🚀`,
  preheader: "Crée encore plus avec l'IA - images et vidéos illimitées",
  body: `
    <div style="${emailStyles.tiguy}">🚀</div>
    <h1 style="${emailStyles.heading}">T'aimes créer avec l'IA?</h1>
    <p style="${emailStyles.paragraph}">
      Hey ${username}! J'ai vu que t'as utilisé <strong>${aiGenerationsUsed}</strong> de tes 
      <strong>${maxFreeGenerations}</strong> générations gratuites dans Ti-Guy Studio.
    </p>
    <p style="${emailStyles.paragraph}">
      Si tu veux continuer à créer sans limites, 
      <span style="${emailStyles.highlight}">Creator Pro</span> c'est fait pour toi!
    </p>
    <div style="${emailStyles.card}">
      <p style="margin: 8px 0;"><strong>Creator Pro (Argent) - 9.99$/mois:</strong></p>
      <p style="margin: 8px 0;">✨ 500 images AI par mois</p>
      <p style="margin: 8px 0;">🎬 30 vidéos AI par mois</p>
      <p style="margin: 8px 0;">✓ Badge vérifié sur ton profil</p>
      <p style="margin: 8px 0;">⚡ Génération prioritaire (plus rapide!)</p>
    </div>
    <p style="${emailStyles.paragraph}">
      Pis tu supportes une app québécoise en même temps! 🦫⚜️
    </p>
  `,
  cta: {
    text: "Passer à Creator Pro →",
    url: "{{APP_URL}}/premium?plan=silver",
  },
});

// Re-engagement email - For inactive users (7+ days)
export const reengagementEmail = (
  username: string,
  daysSinceLastVisit: number,
): EmailTemplate => ({
  subject: `${username}, on s'ennuie de toi! 🦫`,
  preheader: "Y'a du nouveau sur Zyeuté depuis ta dernière visite",
  body: `
    <div style="${emailStyles.tiguy}">🦫</div>
    <h1 style="${emailStyles.heading}">Allô ${username}!</h1>
    <p style="${emailStyles.paragraph}">
      Ça fait ${daysSinceLastVisit} jours qu'on t'a pas vu! 
      Ti-Guy s'ennuie de toi! 😢
    </p>
    <p style="${emailStyles.paragraph}">
      Pendant ce temps-là, y'a eu plein de belles affaires sur Zyeuté:
    </p>
    <div style="${emailStyles.card}">
      <p style="margin: 8px 0;">🆕 Du nouveau contenu de créateurs québécois</p>
      <p style="margin: 8px 0;">🔥 Des posts qui font réagir</p>
      <p style="margin: 8px 0;">🎨 Des nouvelles fonctionnalités dans Studio</p>
    </div>
    <p style="${emailStyles.paragraph}">
      Viens voir ce qui se passe! On t'attend 🧡
    </p>
  `,
  cta: {
    text: "Revenir sur Zyeuté →",
    url: "{{APP_URL}}/",
  },
});

// Helper to wrap content in email layout
export function wrapEmailTemplate(
  template: EmailTemplate,
  appUrl: string,
): string {
  const ctaHtml = template.cta
    ? `<a href="${template.cta.url.replace("{{APP_URL}}", appUrl)}" style="${emailStyles.cta}">${template.cta.text}</a>`
    : "";

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${template.subject}</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet">
</head>
<body style="margin: 0; padding: 20px; background-color: #0a0a0a;">
  <!--[if mso]>
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="600" align="center">
  <tr><td>
  <![endif]-->
  
  <div style="${emailStyles.container}">
    <!-- Header -->
    <div style="${emailStyles.header}">
      <div style="${emailStyles.logo}">Zyeuté</div>
      <p style="margin: 8px 0 0 0; color: #d4d4d4; font-size: 14px;">L'app sociale du Québec 🦫⚜️</p>
    </div>
    
    <!-- Body -->
    <div style="${emailStyles.body}">
      ${template.body}
      
      <div style="text-align: center;">
        ${ctaHtml}
      </div>
    </div>
    
    <!-- Footer -->
    <div style="${emailStyles.footer}">
      <p style="margin: 0 0 8px 0;">Fait au Québec, pour le Québec 🦫⚜️</p>
      <p style="margin: 0 0 8px 0;">
        <a href="${appUrl}/settings/notifications" style="color: #FFBF00; text-decoration: none;">Gérer mes notifications</a>
        &nbsp;•&nbsp;
        <a href="${appUrl}/unsubscribe?email={{EMAIL}}" style="color: #737373; text-decoration: none;">Se désabonner</a>
      </p>
      <p style="margin: 0; color: #525252;">
        © ${new Date().getFullYear()} Zyeuté Inc. • Montréal, Québec
      </p>
    </div>
  </div>
  
  <!--[if mso]>
  </td></tr>
  </table>
  <![endif]-->
</body>
</html>
  `.trim();
}

export default {
  welcomeEmail,
  onboardingDay1Email,
  onboardingDay3Email,
  onboardingDay7Email,
  weeklyDigestEmail,
  upgradePromptEmail,
  reengagementEmail,
  wrapEmailTemplate,
  emailStyles,
};
