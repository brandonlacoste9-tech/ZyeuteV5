/**
 * Community Guidelines - Quebec-aware content moderation rules
 */

import React from 'react';
import { Header } from '../../components/Header';
import { BottomNav } from '../../components/BottomNav';

export const CommunityGuidelines: React.FC = () => {
  return (
    <div className="min-h-screen bg-black pb-20">
      <Header title="Directives de la Communauté" showBack={true} />

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="card-edge p-8">
          {/* Last Updated */}
          <div className="inline-block bg-gold-500/20 px-4 py-2 rounded-full mb-6">
            <p className="text-gold-400 text-sm font-semibold">
              Dernière mise à jour: 26 novembre 2025
            </p>
          </div>

          {/* Introduction */}
          <h1 className="text-4xl font-bold text-white mb-6">
            Directives de la Communauté ⚜️
          </h1>
          <p className="text-white/80 text-lg mb-8 leading-relaxed">
            Zyeuté est une plateforme inclusive pour tous les Québécois et francophones. Nous voulons
            que chacun se sente en sécurité, respecté et libre de s&apos;exprimer dans notre culture unique.
          </p>

          {/* Section 1: Prohibited Content */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
              <span className="text-3xl">❌</span>
              Contenu Interdit
            </h2>
            <div className="space-y-6">
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6">
                <h3 className="text-red-400 font-bold mb-2">🚫 Intimidation et Harcèlement</h3>
                <p className="text-white/70 mb-2">
                  Attaques personnelles répétées, moqueries sur l&apos;apparence physique, le poids,
                  l&apos;orientation sexuelle ou l&apos;identité de genre.
                </p>
                <p className="text-white/50 text-sm italic">
                  Note: Les taquineries amicales entre amis sont acceptables.
                </p>
              </div>

              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6">
                <h3 className="text-red-400 font-bold mb-2">🚫 Discours Haineux</h3>
                <p className="text-white/70 mb-2">
                  Racisme, sexisme, homophobie, transphobie, xénophobie, discrimination religieuse,
                  suprémacisme ou négation de génocides.
                </p>
                <p className="text-white/50 text-sm italic">
                  Tolérance zéro pour la haine.
                </p>
              </div>

              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6">
                <h3 className="text-red-400 font-bold mb-2">🚫 Violence et Menaces</h3>
                <p className="text-white/70 mb-2">
                  Menaces de violence physique, incitation à l&apos;automutilation ou au suicide,
                  glorification de violence, instructions pour armes ou explosifs.
                </p>
              </div>

              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6">
                <h3 className="text-red-400 font-bold mb-2">🚫 Harcèlement Sexuel</h3>
                <p className="text-white/70 mb-2">
                  Messages sexuels non sollicités, commentaires déplacés sur le corps, demandes
                  inappropriées, partage d&apos;images intimes sans consentement.
                </p>
              </div>

              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6">
                <h3 className="text-red-400 font-bold mb-2">🚫 Exploitation de Mineurs</h3>
                <p className="text-white/70 mb-2">
                  TOLÉRANCE ZÉRO. Tout contenu d&apos;exploitation de mineurs entraîne un bannissement
                  permanent immédiat et signalement aux autorités.
                </p>
              </div>

              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6">
                <h3 className="text-red-400 font-bold mb-2">🚫 Activités Illégales</h3>
                <p className="text-white/70 mb-2">
                  Vente de drogues illégales, armes, contenu piraté, fraude, escroquerie.
                </p>
              </div>

              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6">
                <h3 className="text-red-400 font-bold mb-2">🚫 Spam et Fraude</h3>
                <p className="text-white/70 mb-2">
                  Liens malveillants répétés, publicité excessive non sollicitée, chaînes de lettres,
                  comportement de bot, usurpation d&apos;identité.
                </p>
              </div>
            </div>
          </section>

          {/* Section 2: Sensitive Content */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
              <span className="text-3xl">⚠️</span>
              Contenu Sensible
            </h2>
            <div className="space-y-4">
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-6">
                <h3 className="text-yellow-400 font-bold mb-2">⚠️ Nudité Artistique</h3>
                <p className="text-white/70">
                  Acceptable si contexte artistique, mais doit être marquée comme sensible.
                  Pas de contenu sexuellement explicite.
                </p>
              </div>

              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-6">
                <h3 className="text-yellow-400 font-bold mb-2">⚠️ Violence Graphique</h3>
                <p className="text-white/70">
                  Contenu graphique ou gore nécessite un avertissement. Contexte journalistique acceptable.
                </p>
              </div>

              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-6">
                <h3 className="text-yellow-400 font-bold mb-2">⚠️ Contenu Choquant</h3>
                <p className="text-white/70">
                  Contenu potentiellement troublant doit être flouté avec avertissement.
                </p>
              </div>
            </div>
          </section>

          {/* Section 3: Expected Behavior */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
              <span className="text-3xl">✅</span>
              Comportement Attendu
            </h2>
            <div className="space-y-4">
              <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-6">
                <ul className="space-y-3 text-white/80">
                  <li className="flex gap-3">
                    <span className="text-green-400 font-bold">✅</span>
                    <span><strong>Respecter les autres:</strong> Traite tout le monde avec dignité</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-green-400 font-bold">✅</span>
                    <span><strong>Être authentique:</strong> Sois toi-même, pas quelqu&apos;un d&apos;autre</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-green-400 font-bold">✅</span>
                    <span><strong>Penser avant de publier:</strong> Réfléchis à l&apos;impact de tes mots</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-green-400 font-bold">✅</span>
                    <span><strong>Célébrer la diversité:</strong> Le Québec est riche de ses différences</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-green-400 font-bold">✅</span>
                    <span><strong>Signaler les violations:</strong> Aide-nous à garder Zyeuté sûr</span>
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* Section 4: Quebec Cultural Exceptions */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
              <span className="text-3xl">⚜️</span>
              Exceptions Culturelles Québécoises
            </h2>
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-6">
              <p className="text-white/80 mb-4">
                Zyeuté comprend et respecte la culture québécoise unique. Les éléments suivants sont
                <strong className="text-gold-400"> acceptables</strong>:
              </p>
              <ul className="space-y-2 text-white/70">
                <li>✅ Expressions colorées du joual (tabarnak, crisse, câlisse, ostie, etc.)</li>
                <li>✅ Débats politiques passionnés (souveraineté, langue française, identité)</li>
                <li>✅ Humour grinçant et sarcasme québécois</li>
                <li>✅ Critique sociale constructive</li>
                <li>✅ Références culturelles locales (Ti-Guy, poutine, sirop d&apos;érable)</li>
                <li>✅ Blagues entre amis et taquineries amicales</li>
                <li>✅ Expressions positives (&quot;malade!&quot;, &quot;sick!&quot;, &quot;en feu!&quot;)</li>
              </ul>
              <p className="text-white/50 text-sm mt-4 italic">
                Note: Ces exceptions ne couvrent PAS le harcèlement, la haine ou les menaces.
              </p>
            </div>
          </section>

          {/* Section 5: Consequences */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
              <span className="text-3xl">⚖️</span>
              Conséquences des Violations
            </h2>
            <div className="space-y-4">
              <div className="bg-white/5 rounded-xl p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full bg-yellow-500/20 flex items-center justify-center">
                    <span className="text-2xl">1️⃣</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-yellow-400 font-bold">Premier Avertissement</h3>
                    <p className="text-white/60 text-sm">Contenu supprimé + notification</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full bg-orange-500/20 flex items-center justify-center">
                    <span className="text-2xl">2️⃣</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-orange-400 font-bold">Deuxième Violation</h3>
                    <p className="text-white/60 text-sm">Suspension 24 heures</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
                    <span className="text-2xl">3️⃣</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-red-400 font-bold">Troisième Violation</h3>
                    <p className="text-white/60 text-sm">Suspension 7 jours</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center">
                    <span className="text-2xl">4️⃣</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-purple-400 font-bold">Quatrième Violation</h3>
                    <p className="text-white/60 text-sm">Suspension 30 jours</p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-black/80 border-2 border-red-500 flex items-center justify-center">
                    <span className="text-2xl">5️⃣</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-red-500 font-bold">Cinquième Violation</h3>
                    <p className="text-white/60 text-sm">Bannissement permanent</p>
                  </div>
                </div>
              </div>

              <div className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-6">
                <h3 className="text-purple-400 font-bold mb-2">⚡ Violations Graves</h3>
                <p className="text-white/70">
                  Certaines violations (exploitation de mineurs, menaces de violence, contenu illégal grave)
                  entraînent un <strong>bannissement immédiat</strong> sans avertissement préalable.
                </p>
              </div>
            </div>
          </section>

          {/* Section 6: Appeal Process */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
              <span className="text-3xl">📝</span>
              Processus d&apos;Appel
            </h2>
            <div className="bg-white/5 rounded-xl p-6">
              <p className="text-white/80 mb-4">
                Si tu penses qu&apos;une décision a été prise par erreur, tu peux la contester:
              </p>
              <ol className="space-y-3 text-white/70 list-decimal list-inside">
                <li>Tu reçois une notification de l&apos;avertissement ou suspension</li>
                <li>Clique sur &quot;Contester cette décision&quot; dans la notification</li>
                <li>Explique pourquoi tu penses que c&apos;est une erreur (max 500 caractères)</li>
                <li>Un modérateur humain révise ton cas sous 48 heures</li>
                <li>Tu reçois une décision finale par notification</li>
              </ol>
              <div className="mt-4 bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
                <p className="text-blue-400 text-sm">
                  💡 <strong>Note:</strong> Les appels frivoles ou répétés peuvent affecter ton compte.
                  Utilise ce système seulement si tu as une raison légitime.
                </p>
              </div>
            </div>
          </section>

          {/* Section 7: Reporting */}
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-3">
              <span className="text-3xl">🚨</span>
              Signaler une Violation
            </h2>
            <div className="bg-white/5 rounded-xl p-6">
              <p className="text-white/80 mb-4">
                Aide-nous à garder Zyeuté sûr en signalant le contenu qui viole ces directives:
              </p>
              <div className="space-y-3">
                <div className="flex gap-3">
                  <span className="text-gold-400 font-bold">1.</span>
                  <p className="text-white/70">
                    Clique sur les trois points (⋯) sur n&apos;importe quel post ou commentaire
                  </p>
                </div>
                <div className="flex gap-3">
                  <span className="text-gold-400 font-bold">2.</span>
                  <p className="text-white/70">
                    Sélectionne &quot;Signaler&quot;
                  </p>
                </div>
                <div className="flex gap-3">
                  <span className="text-gold-400 font-bold">3.</span>
                  <p className="text-white/70">
                    Choisis la raison du signalement
                  </p>
                </div>
                <div className="flex gap-3">
                  <span className="text-gold-400 font-bold">4.</span>
                  <p className="text-white/70">
                    Ajoute des détails (optionnel mais utile)
                  </p>
                </div>
                <div className="flex gap-3">
                  <span className="text-gold-400 font-bold">5.</span>
                  <p className="text-white/70">
                    Notre équipe révise sous 24-48 heures
                  </p>
                </div>
              </div>
              <div className="mt-4 bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                <p className="text-green-400 text-sm">
                  🔒 <strong>Confidentiel:</strong> Ton identité reste privée. La personne signalée ne
                  saura jamais qui a fait le signalement.
                </p>
              </div>
            </div>
          </section>

          {/* Contact */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">Contact</h2>
            <p className="text-white/70 mb-4">
              Des questions sur ces directives? Contacte-nous:
            </p>
            <ul className="space-y-2 text-white/60">
              <li>📧 Email: <a href="mailto:support@zyeute.com" className="text-gold-400 hover:underline">support@zyeute.com</a></li>
              <li>🛡️ Modération: <a href="mailto:moderation@zyeute.com" className="text-gold-400 hover:underline">moderation@zyeute.com</a></li>
              <li>📖 Centre d&apos;aide: <a href="/help" className="text-gold-400 hover:underline">zyeute.com/help</a></li>
            </ul>
          </section>

          {/* Footer */}
          <div className="border-t border-white/10 pt-8">
            <p className="text-white/40 text-sm text-center">
              Ces directives peuvent être mises à jour. Consulte cette page régulièrement.
            </p>
            <p className="text-white/40 text-sm text-center mt-2">
              Fait au Québec, pour le Québec. Avec fierté! 🇨🇦⚜️
            </p>
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default CommunityGuidelines;

