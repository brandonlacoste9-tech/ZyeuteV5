/* Migration: Rename incorrect column 'visibilite' to 'visibility' in posts table */
ALTER TABLE posts RENAME COLUMN visibilite TO visibility;
