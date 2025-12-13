/**
 * Terms of Service - Legal agreement for Zyeuté
 * Quebec Law compliant
 */

import React from 'react';
import { Header } from '../../components/Header';
import { BottomNav } from '../../components/BottomNav';

export const TermsOfService: React.FC = () => {
  return (
    <div className="min-h-screen bg-black pb-20">
      <Header title="Conditions d'Utilisation" showBack={true} />

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="card-edge p-8">
          {/* Last Updated */}
          <div className="inline-block bg-gold-500/20 px-4 py-2 rounded-full mb-6">
            <p className="text-gold-400 text-sm font-semibold">
              Dernière mise à jour: 26 novembre 2025
            </p>
          </div>

          <h1 className="text-4xl font-bold text-white mb-8">
            Conditions d&apos;Utilisation
          </h1>

          {/* Section 1: Acceptance */}
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-gold-400 mb-4">
              1. Acceptation des Conditions
            </h2>
            <p className="text-white/80 leading-relaxed mb-4">
              En accédant et en utilisant Zyeuté (&quot;l&apos;Application&quot;, &quot;le Service&quot;, &quot;nous&quot;, &quot;notre&quot;), vous
              acceptez d&apos;être lié par ces Conditions d&apos;Utilisation. Si vous n&apos;acceptez pas ces conditions,
              veuillez ne pas utiliser notre service.
            </p>
            <p className="text-white/80 leading-relaxed">
              Ces conditions constituent un accord juridiquement contraignant entre vous et Zyeuté Inc.,
              une société enregistrée au Québec, Canada.
            </p>
          </section>

          {/* Section 2: Eligibility */}
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-gold-400 mb-4">
              2. Éligibilité
            </h2>
            <div className="bg-white/5 rounded-xl p-6">
              <p className="text-white/80 leading-relaxed mb-4">
                Pour utiliser Zyeuté, vous devez:
              </p>
              <ul className="space-y-2 text-white/70">
                <li>✅ Avoir au moins <strong className="text-white">13 ans</strong> (âge minimum au Canada)</li>
                <li>✅ Avoir au moins <strong className="text-white">18 ans</strong> pour les fonctionnalités d&apos;achat</li>
                <li>✅ Ne pas être banni de l&apos;Application</li>
                <li>✅ Respecter les lois canadiennes et québécoises</li>
                <li>✅ Fournir des informations exactes lors de l&apos;inscription</li>
              </ul>
            </div>
          </section>

          {/* Section 3: Account */}
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-gold-400 mb-4">
              3. Inscription et Compte
            </h2>
            <p className="text-white/80 leading-relaxed mb-4">
              <strong>3.1 Création de compte:</strong> Vous vous engagez à fournir des informations
              exactes, complètes et à jour lors de votre inscription.
            </p>
            <p className="text-white/80 leading-relaxed mb-4">
              <strong>3.2 Un compte par personne:</strong> Chaque personne ne peut créer qu&apos;un seul compte.
              Les comptes multiples peuvent être supprimés.
            </p>
            <p className="text-white/80 leading-relaxed mb-4">
              <strong>3.3 Sécurité:</strong> Vous êtes responsable de maintenir la confidentialité de
              votre mot de passe et de toute activité sur votre compte.
            </p>
            <p className="text-white/80 leading-relaxed">
              <strong>3.4 Notification:</strong> Vous devez nous notifier immédiatement de toute
              utilisation non autorisée de votre compte.
            </p>
          </section>

          {/* Section 4: Acceptable Use */}
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-gold-400 mb-4">
              4. Utilisation Acceptable
            </h2>
            <p className="text-white/80 leading-relaxed mb-4">
              Vous vous engagez à NE PAS:
            </p>
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6">
              <ul className="space-y-2 text-white/70">
                <li>❌ Publier du contenu illégal, haineux, violent ou harcelant</li>
                <li>❌ Usurper l&apos;identité d&apos;une autre personne</li>
                <li>❌ Spammer ou envoyer des messages non sollicités</li>
                <li>❌ Violer les droits de propriété intellectuelle</li>
                <li>❌ Harceler, intimider ou menacer d&apos;autres utilisateurs</li>
                <li>❌ Publier du contenu d&apos;exploitation de mineurs</li>
                <li>❌ Utiliser des bots ou automatisation non autorisée</li>
                <li>❌ Contourner les systèmes de sécurité de l&apos;Application</li>
              </ul>
            </div>
          </section>

          {/* Section 5: User Content */}
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-gold-400 mb-4">
              5. Contenu Utilisateur
            </h2>
            <p className="text-white/80 leading-relaxed mb-4">
              <strong>5.1 Vos droits:</strong> Vous conservez tous les droits sur le contenu que vous
              publiez sur Zyeuté.
            </p>
            <p className="text-white/80 leading-relaxed mb-4">
              <strong>5.2 Licence accordée:</strong> En publiant du contenu, vous accordez à Zyeuté
              une licence mondiale, non-exclusive, gratuite et transférable pour utiliser, reproduire,
              distribuer et afficher votre contenu dans le cadre de l&apos;exploitation de l&apos;Application.
            </p>
            <p className="text-white/80 leading-relaxed">
              <strong>5.3 Responsabilité:</strong> Vous êtes seul responsable du contenu que vous publiez.
            </p>
          </section>

          {/* Section 6: Intellectual Property */}
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-gold-400 mb-4">
              6. Propriété Intellectuelle de Zyeuté
            </h2>
            <p className="text-white/80 leading-relaxed mb-4">
              L&apos;Application, son design, ses fonctionnalités, et tous les éléments suivants sont la
              propriété exclusive de Zyeuté Inc.:
            </p>
            <div className="bg-gold-500/10 border border-gold-500/30 rounded-xl p-6">
              <ul className="space-y-2 text-white/70">
                <li>⚜️ Logo Zyeuté® (marque déposée)</li>
                <li>🦫 Mascotte Ti-Guy™</li>
                <li>💡 Système de &quot;Feux&quot; (Fire Rating)</li>
                <li>🎨 Interface utilisateur et design</li>
                <li>💻 Code source et algorithmes</li>
              </ul>
            </div>
          </section>

          {/* Section 7: Virtual Currency */}
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-gold-400 mb-4">
              7. Monnaie Virtuelle (&quot;Cennes&quot;)
            </h2>
            <p className="text-white/80 leading-relaxed mb-4">
              <strong>7.1 Achat:</strong> Les &quot;cennes&quot; sont une monnaie virtuelle utilisée pour acheter
              des cadeaux virtuels sur l&apos;Application.
            </p>
            <p className="text-white/80 leading-relaxed mb-4">
              <strong>7.2 Non remboursable:</strong> Les achats de cennes sont <strong>finaux et non
              remboursables</strong>, sauf si requis par la loi.
            </p>
            <p className="text-white/80 leading-relaxed mb-4">
              <strong>7.3 Aucune valeur réelle:</strong> Les cennes n&apos;ont <strong>aucune valeur monétaire
              réelle</strong> et ne peuvent être échangées contre de l&apos;argent.
            </p>
            <p className="text-white/80 leading-relaxed">
              <strong>7.4 Révocation:</strong> Nous nous réservons le droit de révoquer les cennes en cas
              de violation des conditions ou d&apos;activité frauduleuse.
            </p>
          </section>

          {/* Section 8: Termination */}
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-gold-400 mb-4">
              8. Résiliation du Compte
            </h2>
            <p className="text-white/80 leading-relaxed mb-4">
              <strong>8.1 Par vous:</strong> Vous pouvez supprimer votre compte à tout moment via les
              paramètres de l&apos;Application.
            </p>
            <p className="text-white/80 leading-relaxed mb-4">
              <strong>8.2 Par nous:</strong> Nous nous réservons le droit de suspendre ou résilier votre
              compte en cas de violation de ces conditions, sans préavis.
            </p>
            <p className="text-white/80 leading-relaxed">
              <strong>8.3 Effet:</strong> Après résiliation, vous perdez l&apos;accès à votre compte et
              votre contenu. Nous conservons certaines données conformément à notre Politique de Conservation.
            </p>
          </section>

          {/* Section 9: Liability */}
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-gold-400 mb-4">
              9. Limitation de Responsabilité
            </h2>
            <div className="bg-white/5 rounded-xl p-6">
              <p className="text-white/80 leading-relaxed mb-4">
                L&apos;Application est fournie &quot;TELLE QUELLE&quot; et &quot;SELON DISPONIBILITÉ&quot; sans garantie d&apos;aucune sorte.
              </p>
              <p className="text-white/80 leading-relaxed mb-4">
                Zyeuté Inc. ne sera pas responsable des dommages indirects, accessoires, spéciaux ou
                consécutifs découlant de votre utilisation de l&apos;Application.
              </p>
              <p className="text-white/70 text-sm italic">
                Dans la mesure maximale permise par la loi applicable.
              </p>
            </div>
          </section>

          {/* Section 10: Governing Law */}
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-gold-400 mb-4">
              10. Loi Applicable
            </h2>
            <p className="text-white/80 leading-relaxed mb-4">
              Ces conditions sont régies par les lois de la <strong>Province de Québec</strong> et les
              lois fédérales du <strong>Canada</strong> applicables.
            </p>
            <p className="text-white/80 leading-relaxed">
              Tout litige découlant de ces conditions sera soumis à la juridiction exclusive des
              tribunaux de Montréal, Québec.
            </p>
          </section>

          {/* Section 11: Changes */}
          <section className="mb-10">
            <h2 className="text-2xl font-bold text-gold-400 mb-4">
              11. Modifications des Conditions
            </h2>
            <p className="text-white/80 leading-relaxed mb-4">
              Nous nous réservons le droit de modifier ces conditions à tout moment. Les modifications
              importantes seront notifiées par:
            </p>
            <ul className="space-y-2 text-white/70 ml-6">
              <li>• Notification dans l&apos;Application</li>
              <li>• Email à votre adresse enregistrée</li>
              <li>• Bannière sur la page d&apos;accueil</li>
            </ul>
            <p className="text-white/80 leading-relaxed mt-4">
              Votre utilisation continue après modifications constitue votre acceptation des nouvelles
              conditions.
            </p>
          </section>

          {/* Section 12: Contact */}
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-gold-400 mb-4">
              12. Contact
            </h2>
            <p className="text-white/80 leading-relaxed mb-4">
              Pour toute question concernant ces conditions:
            </p>
            <div className="bg-white/5 rounded-xl p-6">
              <p className="text-white font-semibold mb-4">Zyeuté Inc.</p>
              <ul className="space-y-2 text-white/70">
                <li>📍 Montréal, Québec, Canada</li>
                <li>📧 Email: <a href="mailto:legal@zyeute.com" className="text-gold-400 hover:underline">legal@zyeute.com</a></li>
                <li>📧 Support: <a href="mailto:support@zyeute.com" className="text-gold-400 hover:underline">support@zyeute.com</a></li>
                <li>🌐 Site web: <a href="https://zyeute.com" className="text-gold-400 hover:underline">zyeute.com</a></li>
              </ul>
            </div>
          </section>

          {/* Footer */}
          <div className="border-t border-white/10 pt-8">
            <p className="text-white/40 text-sm text-center mb-4">
              En utilisant Zyeuté, vous acceptez également notre{' '}
              <a href="/legal/privacy" className="text-gold-400 hover:underline">Politique de Confidentialité</a>
              {' '}et nos{' '}
              <a href="/legal/community-guidelines" className="text-gold-400 hover:underline">Directives de la Communauté</a>.
            </p>
            <p className="text-white/40 text-sm text-center">
              Fait au Québec, pour le Québec. Avec fierté! 🇨🇦⚜️
            </p>
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};

export default TermsOfService;

