/**
 * Privacy Policy - GDPR, PIPEDA, Quebec Law 25, CCPA Compliant
 */

import React from "react";
import { Header } from "../../components/Header";
import { BottomNav } from "../../components/BottomNav";
import { useSEO } from "@/hooks/useSEO";

export const PrivacyPolicy: React.FC = () => {
  useSEO({
    title: "Politique de confidentialité",
    description:
      "Politique de confidentialité Zyeute — GDPR, PIPEDA, Loi 25 du Québec et CCPA. Comment on protège tes données.",
    url: "/privacy",
  });

  return (
    <div className="min-h-screen bg-black pb-20">
      <Header title="Politique de Confidentialité" showBack={true} />

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="card-edge p-8">
          {/* Last Updated */}
          <div className="inline-block bg-gold-500/20 px-4 py-2 rounded-full mb-6">
            <p className="text-gold-400 text-sm font-semibold">
              Dernière mise à jour: 26 novembre 2025
            </p>
          </div>

          <h1 className="text-4xl font-bold text-white mb-6">
            Politique de Confidentialité
          </h1>

          {/* Compliance Badges */}
          <div className="flex flex-wrap gap-2 mb-8">
            <span className="px-3 py-1 bg-blue-500/20 text-blue-400 text-xs font-semibold rounded-full">
              ✅ GDPR Compliant
            </span>
            <span className="px-3 py-1 bg-green-500/20 text-green-400 text-xs font-semibold rounded-full">
              ✅ PIPEDA Compliant
            </span>
            <span className="px-3 py-1 bg-purple-500/20 text-purple-400 text-xs font-semibold rounded-full">
              ✅ Quebec Law 25
            </span>
            <span className="px-3 py-1 bg-orange-500/20 text-orange-400 text-xs font-semibold rounded-full">
              ✅ CCPA Compliant
            </span>
          </div>

          <p className="text-white/80 text-lg mb-8 leading-relaxed">
            Chez Zyeuté, ta vie privée est notre priorité. Cette politique
            explique comment nous collectons, utilisons et protégeons tes
            informations personnelles.
          </p>

          {/* Section 1: Information We Collect */}
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-gold-400 mb-4">
              1. Informations Collectées
            </h2>

            <h3 className="text-xl font-semibold text-white mb-3">
              1.1 Informations de Profil
            </h3>
            <ul className="space-y-2 text-white/70 mb-6 ml-6">
              <li>• Nom d&apos;utilisateur, nom d&apos;affichage, email</li>
              <li>• Avatar, bio, ville, région</li>
              <li>• Date de naissance (pour vérification d&apos;âge)</li>
            </ul>

            <h3 className="text-xl font-semibold text-white mb-3">
              1.2 Contenu Publié
            </h3>
            <ul className="space-y-2 text-white/70 mb-6 ml-6">
              <li>• Photos, vidéos, Stories</li>
              <li>• Captions, commentaires, messages</li>
              <li>• Interactions (feux, cadeaux, follows)</li>
            </ul>

            <h3 className="text-xl font-semibold text-white mb-3">
              1.3 Données Techniques
            </h3>
            <ul className="space-y-2 text-white/70 mb-6 ml-6">
              <li>
                • Adresse IP, type d&apos;appareil, système d&apos;exploitation
              </li>
              <li>• Navigateur, langue, fuseau horaire</li>
              <li>• Cookies et technologies similaires</li>
            </ul>

            <h3 className="text-xl font-semibold text-white mb-3">
              1.4 Données de Localisation
            </h3>
            <p className="text-white/70 ml-6">
              Région et ville (optionnel, fourni par toi) pour le contenu
              hyper-local.
            </p>
          </section>

          {/* Section 2: How We Use Information */}
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-gold-400 mb-4">
              2. Utilisation des Informations
            </h2>
            <div className="space-y-4">
              <div className="bg-white/5 rounded-xl p-6">
                <p className="text-white font-semibold mb-2">
                  🎯 Fournir le Service
                </p>
                <p className="text-white/70">
                  Afficher ton contenu, connecter avec d&apos;autres
                  utilisateurs, fonctionnalités sociales
                </p>
              </div>
              <div className="bg-white/5 rounded-xl p-6">
                <p className="text-white font-semibold mb-2">
                  🎨 Personnalisation
                </p>
                <p className="text-white/70">
                  Recommandations de contenu, suggestions de connexions, contenu
                  hyper-local
                </p>
              </div>
              <div className="bg-white/5 rounded-xl p-6">
                <p className="text-white font-semibold mb-2">
                  🛡️ Sécurité et Intégrité
                </p>
                <p className="text-white/70">
                  Modération par IA, détection de spam, prévention de la fraude,
                  respect des directives
                </p>
              </div>
              <div className="bg-white/5 rounded-xl p-6">
                <p className="text-white font-semibold mb-2">
                  📊 Analyses et Recherche
                </p>
                <p className="text-white/70">
                  Amélioration du service, statistiques anonymisées,
                  développement de nouvelles fonctionnalités
                </p>
              </div>
              <div className="bg-white/5 rounded-xl p-6">
                <p className="text-white font-semibold mb-2">
                  📧 Communication
                </p>
                <p className="text-white/70">
                  Notifications, updates, support client, emails marketing (avec
                  consentement)
                </p>
              </div>
            </div>
          </section>

          {/* Section 3: Sharing */}
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-gold-400 mb-4">
              3. Partage des Informations
            </h2>
            <p className="text-white/80 leading-relaxed mb-4">
              <strong>3.1 Avec d&apos;autres utilisateurs:</strong> Ton contenu
              public est visible selon tes paramètres de confidentialité.
            </p>
            <p className="text-white/80 leading-relaxed mb-4">
              <strong>3.2 Avec des tiers:</strong> Nous ne vendons JAMAIS tes
              données personnelles. Partage limité avec:
            </p>
            <ul className="space-y-2 text-white/70 ml-6 mb-4">
              <li>
                • Fournisseurs de services (Supabase, Google Cloud) - sous NDA
              </li>
              <li>
                • Processeurs de paiement (Stripe) - pour achats uniquement
              </li>
              <li>• Services d&apos;analytics (anonymisé)</li>
            </ul>
            <p className="text-white/80 leading-relaxed">
              <strong>3.3 Raisons légales:</strong> Nous pouvons divulguer tes
              informations si requis par la loi, ordonnance judiciaire, ou pour
              protéger nos droits.
            </p>
          </section>

          {/* Section 4: Your Rights (GDPR/PIPEDA) */}
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-gold-400 mb-4">
              4. Vos Droits (GDPR/PIPEDA/Loi 25)
            </h2>
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-6">
              <p className="text-blue-400 font-semibold mb-4">
                Tu as le droit de:
              </p>
              <ul className="space-y-3 text-white/80">
                <li>
                  <strong>✅ Accès:</strong> Télécharger une copie de toutes tes
                  données
                  <br />
                  <span className="text-white/60 text-sm">
                    Paramètres → Sécurité → Télécharger mes données
                  </span>
                </li>
                <li>
                  <strong>✅ Rectification:</strong> Modifier tes informations
                  personnelles
                  <br />
                  <span className="text-white/60 text-sm">
                    Paramètres → Compte → Modifier le profil
                  </span>
                </li>
                <li>
                  <strong>✅ Suppression:</strong> Supprimer ton compte et
                  toutes tes données
                  <br />
                  <span className="text-white/60 text-sm">
                    Paramètres → Compte → Supprimer mon compte
                  </span>
                </li>
                <li>
                  <strong>✅ Portabilité:</strong> Exporter tes données dans un
                  format structuré
                  <br />
                  <span className="text-white/60 text-sm">
                    Format JSON téléchargeable
                  </span>
                </li>
                <li>
                  <strong>✅ Opposition:</strong> T&apos;opposer au traitement
                  de tes données
                  <br />
                  <span className="text-white/60 text-sm">
                    Contact: privacy@zyeute.com
                  </span>
                </li>
                <li>
                  <strong>✅ Retrait du consentement:</strong> Retirer ton
                  consentement à tout moment
                  <br />
                  <span className="text-white/60 text-sm">
                    Via les paramètres de confidentialité
                  </span>
                </li>
              </ul>
            </div>
          </section>

          {/* Section 5: Data Security */}
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-gold-400 mb-4">
              5. Sécurité des Données
            </h2>
            <p className="text-white/80 leading-relaxed mb-4">
              Nous utilisons des mesures de sécurité de niveau entreprise pour
              protéger tes données:
            </p>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white/5 rounded-xl p-4">
                <p className="text-white font-semibold mb-2">🔐 Chiffrement</p>
                <p className="text-white/60 text-sm">
                  SSL/TLS pour toutes les transmissions
                </p>
              </div>
              <div className="bg-white/5 rounded-xl p-4">
                <p className="text-white font-semibold mb-2">
                  🏢 Infrastructure
                </p>
                <p className="text-white/60 text-sm">
                  Supabase (certifié ISO 27001)
                </p>
              </div>
              <div className="bg-white/5 rounded-xl p-4">
                <p className="text-white font-semibold mb-2">
                  🔑 Authentification
                </p>
                <p className="text-white/60 text-sm">
                  2FA disponible, hashing bcrypt
                </p>
              </div>
              <div className="bg-white/5 rounded-xl p-4">
                <p className="text-white font-semibold mb-2">👥 Accès Limité</p>
                <p className="text-white/60 text-sm">
                  Principe du moindre privilège
                </p>
              </div>
            </div>
          </section>

          {/* Section 6: Data Retention */}
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-gold-400 mb-4">
              6. Conservation des Données
            </h2>
            <div className="space-y-3 text-white/80">
              <p>
                • <strong>Contenu actif:</strong> Conservé tant que ton compte
                est actif
              </p>
              <p>
                • <strong>Contenu supprimé:</strong> 30 jours dans nos backups
              </p>
              <p>
                • <strong>Compte supprimé:</strong> 90 jours puis suppression
                complète
              </p>
              <p>
                • <strong>Données de sécurité:</strong> 1 an (pour prévenir
                abus)
              </p>
              <p>
                • <strong>Données légales:</strong> Durée requise par la loi
                (généralement 3-7 ans)
              </p>
            </div>
          </section>

          {/* Section 7: Minors */}
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-gold-400 mb-4">
              7. Protection des Mineurs
            </h2>
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6">
              <p className="text-white/80 leading-relaxed mb-4">
                <strong>Âge minimum:</strong> 13 ans au Canada (conformément à
                la LPRPDE).
              </p>
              <p className="text-white/80 leading-relaxed mb-4">
                <strong>Consentement parental:</strong> Pour les 13-17 ans, nous
                encourageons la supervision parentale.
              </p>
              <p className="text-white/80 leading-relaxed">
                <strong>Protection spéciale:</strong> Contenu sensible
                automatiquement masqué pour les mineurs. Fonctionnalités
                d&apos;achat réservées aux 18+.
              </p>
            </div>
          </section>

          {/* Section 8: Cookies */}
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-gold-400 mb-4">
              8. Cookies et Technologies Similaires
            </h2>
            <p className="text-white/80 leading-relaxed mb-4">
              Nous utilisons des cookies pour:
            </p>
            <div className="space-y-3">
              <div className="bg-white/5 rounded-xl p-4">
                <p className="text-white font-semibold mb-1">
                  🔐 Cookies Essentiels
                </p>
                <p className="text-white/60 text-sm">
                  Authentification, sécurité (non désactivables)
                </p>
              </div>
              <div className="bg-white/5 rounded-xl p-4">
                <p className="text-white font-semibold mb-1">
                  ⚙️ Cookies Fonctionnels
                </p>
                <p className="text-white/60 text-sm">
                  Préférences (langue, thème, edge lighting)
                </p>
              </div>
              <div className="bg-white/5 rounded-xl p-4">
                <p className="text-white font-semibold mb-1">
                  📊 Cookies d&apos;Analyse
                </p>
                <p className="text-white/60 text-sm">
                  Statistiques anonymes (avec consentement)
                </p>
              </div>
            </div>
            <p className="text-white/70 text-sm mt-4">
              Gère tes préférences: Paramètres → Confidentialité → Cookies
            </p>
          </section>

          {/* Section 9: Your Rights Actions */}
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-gold-400 mb-4">
              9. Exercer Vos Droits
            </h2>
            <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-6">
              <p className="text-white/80 leading-relaxed mb-4">
                Pour exercer vos droits (accès, rectification, suppression,
                portabilité):
              </p>
              <ol className="space-y-2 text-white/70 list-decimal list-inside">
                <li>Connecte-toi à ton compte</li>
                <li>Va dans Paramètres → Sécurité</li>
                <li>
                  Clique &quot;Télécharger mes données&quot; (GDPR export)
                </li>
                <li>
                  Ou contacte:{" "}
                  <a
                    href="mailto:privacy@zyeute.com"
                    className="text-gold-400 hover:underline"
                  >
                    privacy@zyeute.com
                  </a>
                </li>
              </ol>
              <p className="text-white/70 mt-4">
                <strong>Délai de réponse:</strong> Nous répondons sous{" "}
                <strong>30 jours</strong>
                (conformément au GDPR et LPRPDE).
              </p>
            </div>
          </section>

          {/* Section 10: International Transfers */}
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-gold-400 mb-4">
              10. Transferts Internationaux
            </h2>
            <p className="text-white/80 leading-relaxed mb-4">
              <strong>Stockage:</strong> Tes données sont stockées
              principalement au <strong>Canada</strong>
              (conformément à la Loi 25 du Québec).
            </p>
            <p className="text-white/80 leading-relaxed">
              <strong>Transferts:</strong> Si transfert vers un pays tiers, nous
              utilisons des clauses contractuelles types de l&apos;UE et
              garantissons un niveau de protection équivalent.
            </p>
          </section>

          {/* Section 11: DPO Contact */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gold-400 mb-4">
              11. Délégué à la Protection des Données
            </h2>
            <div className="bg-white/5 rounded-xl p-6">
              <p className="text-white font-semibold mb-4">Contact DPO:</p>
              <ul className="space-y-2 text-white/70">
                <li>
                  📧 Email:{" "}
                  <a
                    href="mailto:dpo@zyeute.com"
                    className="text-gold-400 hover:underline"
                  >
                    dpo@zyeute.com
                  </a>
                </li>
                <li>
                  📧 Privacy:{" "}
                  <a
                    href="mailto:privacy@zyeute.com"
                    className="text-gold-400 hover:underline"
                  >
                    privacy@zyeute.com
                  </a>
                </li>
                <li>📍 Adresse: Zyeuté Inc., Montréal, QC, Canada</li>
              </ul>
            </div>
          </section>

          {/* Footer */}
          <div className="border-t border-white/10 pt-8">
            <p className="text-white/40 text-sm text-center mb-4">
              Cette politique peut être modifiée. Nous te notifierons des
              changements importants.
            </p>
            <p className="text-white/40 text-sm text-center">
              Fait au Québec, pour le Québec. Ta vie privée est respectée!
              🇨🇦⚜️🔐
            </p>
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default PrivacyPolicy;
