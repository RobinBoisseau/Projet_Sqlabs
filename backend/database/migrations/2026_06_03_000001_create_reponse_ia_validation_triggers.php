<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Trigger INSERT : quand une réponse IA est créée, met à jour le flag de validation
        // correspondant sur la tentative (dictionnaireValide, dependanceValide ou modeleValide).
        // Une réponse est valide si elle a au moins une remarque ET qu'aucune n'a le statut "invalide".
        DB::unprepared("
            CREATE TRIGGER after_reponse_ia_insert
            AFTER INSERT ON reponse_ias
            FOR EACH ROW
            BEGIN
                DECLARE is_valid BOOLEAN;

                SET is_valid = (
                    JSON_LENGTH(NEW.reponseJson, '$.remarques') > 0
                    AND JSON_SEARCH(NEW.reponseJson, 'one', 'invalide', NULL, '$.remarques[*].statut') IS NULL
                );

                IF NEW.element = 'dico' THEN
                    UPDATE tentatives SET dictionnaireValide = is_valid WHERE id = NEW.tentative_id;
                ELSEIF NEW.element = 'dep' THEN
                    UPDATE tentatives SET dependanceValide = is_valid WHERE id = NEW.tentative_id;
                ELSEIF NEW.element = 'mcd' THEN
                    UPDATE tentatives SET modeleValide = is_valid WHERE id = NEW.tentative_id;
                END IF;
            END
        ");

        // Trigger UPDATE : même logique quand une réponse IA existante est mise à jour (updateOrCreate).
        DB::unprepared("
            CREATE TRIGGER after_reponse_ia_update
            AFTER UPDATE ON reponse_ias
            FOR EACH ROW
            BEGIN
                DECLARE is_valid BOOLEAN;

                SET is_valid = (
                    JSON_LENGTH(NEW.reponseJson, '$.remarques') > 0
                    AND JSON_SEARCH(NEW.reponseJson, 'one', 'invalide', NULL, '$.remarques[*].statut') IS NULL
                );

                IF NEW.element = 'dico' THEN
                    UPDATE tentatives SET dictionnaireValide = is_valid WHERE id = NEW.tentative_id;
                ELSEIF NEW.element = 'dep' THEN
                    UPDATE tentatives SET dependanceValide = is_valid WHERE id = NEW.tentative_id;
                ELSEIF NEW.element = 'mcd' THEN
                    UPDATE tentatives SET modeleValide = is_valid WHERE id = NEW.tentative_id;
                END IF;
            END
        ");
    }

    public function down(): void
    {
        DB::unprepared('DROP TRIGGER IF EXISTS after_reponse_ia_insert');
        DB::unprepared('DROP TRIGGER IF EXISTS after_reponse_ia_update');
    }
};
