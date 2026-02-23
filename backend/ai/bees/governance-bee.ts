import postgres from "postgres";

/**
 * 🦫 GOVERNANCE BEE (L'Abeille du Grand Castor)
 * Cette "Bee" gère la souveraineté et l'ordre sur la plateforme Zyeuté.
 * Elle a le pouvoir d'influencer l'algorithme et de modérer les citoyens.
 */

const SQL_URL = process.env.DATABASE_URL;

// Initialisation du SQL (Lazy)
let sql: any = null;

function obtenirSQL() {
  if (!sql && SQL_URL) {
    sql = postgres(SQL_URL, { ssl: "require" });
  }
  return sql;
}

export const GovernanceBee = {
  /**
   * Injecte du momentum dans une publication choisie par le Grand Castor.
   * Ajoute 10,000 points de momentum et marque comme "Choix du Castor".
   *
   * @param id_publication L'identifiant unique de la vidéo (UUID).
   * @param nouveau_momentum (Optionnel) Le nouveau niveau de momentum.
   * @param raison (Optionnel) La raison du boost.
   * @returns Résultat de l'opération.
   */
  async ajuster_momentum(
    id_publication: string,
    nouveau_momentum?: number,
    raison?: string,
  ) {
    const db = obtenirSQL();
    if (!db) throw new Error("Base de données non configurée.");

    try {
      console.log(
        `🚀 Injection de momentum impérial pour : ${id_publication} (Momentum: ${nouveau_momentum || 10000}, Raison: ${raison || "Choix du Castor"})`,
      );

      const resultat = await db`
        UPDATE publications 
        SET score_momentum = score_momentum + 10000,
            choix_du_castor = true
        WHERE id = ${id_publication}
        RETURNING id, titre, score_momentum;
      `;

      if (resultat.length === 0) {
        return { succes: false, message: "Publication introuvable." };
      }

      return {
        succes: true,
        message:
          "Momentum injecté avec succès ! La vidéo est maintenant souveraine.",
        donnees: resultat[0],
      };
    } catch (erreur) {
      console.error("❌ Échec de l'ajustement du momentum :", erreur);
      return { succes: false, message: "Erreur lors de la mise à jour SQL." };
    }
  },

  /**
   * Bannit un utilisateur et retire ses privilèges de citoyen.
   *
   * @param id_utilisateur L'identifiant du troll à bannir.
   * @param raison La raison de l'expulsion (Bill 96, toxicité, etc.).
   */
  async expulser_troll(id_utilisateur: string, raison: string) {
    const db = obtenirSQL();
    if (!db) throw new Error("Base de données non configurée.");

    try {
      console.log(
        `⚖️ Expulsion du troll ${id_utilisateur}. Raison : ${raison}`,
      );

      const resultat = await db`
        UPDATE user_profiles 
        SET role = 'banned',
            raison_bannissement = ${raison}
        WHERE id = ${id_utilisateur}
        RETURNING id, username, role;
      `;

      if (resultat.length === 0) {
        return { succes: false, message: "Utilisateur introuvable." };
      }

      return {
        succes: true,
        message: `L'utilisateur ${resultat[0].username} a été expulsé de la cité.`,
        donnees: resultat[0],
      };
    } catch (erreur) {
      console.error("❌ Échec de l'expulsion :", erreur);
      return { succes: false, message: "Erreur lors du bannissement SQL." };
    }
  },

  /**
   * Récupère les métadonnées pour analyse avant décision.
   */
  async analyser_metadonnees(id_publication: string) {
    const db = obtenirSQL();
    if (!db) return null;

    const [pub] = await db`
      SELECT p.*, u.username, u.display_name
      FROM publications p
      JOIN user_profiles u ON p.user_id = u.id
      WHERE p.id = ${id_publication}
    `;
    return pub;
  },
};
