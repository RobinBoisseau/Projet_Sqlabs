<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Recalcule les flags de validation pour toutes les tentatives existantes
        // (données créées avant la mise en place des triggers)
        DB::statement("
            UPDATE tentatives t
            JOIN reponse_ias r ON r.tentative_id = t.id AND r.element = 'dico'
            SET t.dictionnaireValide = (
                JSON_LENGTH(r.reponseJson, '$.remarques') > 0
                AND JSON_SEARCH(r.reponseJson, 'one', 'invalide', NULL, '$.remarques[*].statut') IS NULL
            )
        ");

        DB::statement("
            UPDATE tentatives t
            JOIN reponse_ias r ON r.tentative_id = t.id AND r.element = 'dep'
            SET t.dependanceValide = (
                JSON_LENGTH(r.reponseJson, '$.remarques') > 0
                AND JSON_SEARCH(r.reponseJson, 'one', 'invalide', NULL, '$.remarques[*].statut') IS NULL
            )
        ");

        DB::statement("
            UPDATE tentatives t
            JOIN reponse_ias r ON r.tentative_id = t.id AND r.element = 'mcd'
            SET t.modeleValide = (
                JSON_LENGTH(r.reponseJson, '$.remarques') > 0
                AND JSON_SEARCH(r.reponseJson, 'one', 'invalide', NULL, '$.remarques[*].statut') IS NULL
            )
        ");
    }

    public function down(): void
    {
        DB::statement('UPDATE tentatives SET dictionnaireValide = NULL, dependanceValide = NULL, modeleValide = NULL');
    }
};
