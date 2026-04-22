<?php

namespace Database\Seeders;

use App\Models\Tentative;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class TentativeSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Option 1 : Utiliser la Factory (si tu veux générer 10 lignes d'un coup)
        Tentative::factory()->count(10)->create();

        // Option 2 : Créer un enregistrement spécifique manuellement pour tester
        Tentative::create([
            'dictionnaire' => [
                'nom' => 'Dico Français',
                'langue' => 'FR',
                'mots' => 1500
            ],
            'dependance' => [
                'librairie' => 'NLTK',
                'version' => '3.5'
            ],
            'modele' => [
                'architecture' => 'Transformer',
                'layers' => 12
            ],
            'dictionnaireValide' => true,
            'dependanceValide' => true,
            'modeleValide' => false,
            'dictionnaireCorrige' => null,
            'dependanceCorrige' => null,
            'modeleCorrige' => ['action' => 'update_layers', 'value' => 24],
            'dateHeureTentative' => now(),
        ]);
    }
}