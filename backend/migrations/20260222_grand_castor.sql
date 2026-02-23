-- Migration : Mise à jour Grand Castor
-- Ajout des colonnes de gouvernance à la table publications

ALTER TABLE publications ADD COLUMN IF NOT EXISTS titre TEXT;
ALTER TABLE publications ADD COLUMN IF NOT EXISTS score_momentum INTEGER DEFAULT 0;
ALTER TABLE publications ADD COLUMN IF NOT EXISTS choix_du_castor BOOLEAN DEFAULT false;

-- On s'assure que user_profiles supporte le bannissement (déjà présent dans l'enum user_role)
-- Mais on peut ajouter une colonne raison_bannissement pour plus de contexte
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS raison_bannissement TEXT;
