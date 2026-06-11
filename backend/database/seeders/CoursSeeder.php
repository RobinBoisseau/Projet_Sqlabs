<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Cours;
use App\Models\Exercice;

class CoursSeeder extends Seeder
{
    public function run(): void
    {
        $coursER = Cours::firstOrCreate(
            ['nom' => 'Modéliser une BD entité relation'],
            [
                'description' => 'Apprenez à concevoir un modèle entité-relation à partir d\'un énoncé.',
                'image'       => null,
                'visibility'  => true,
            ]
        );

        $playlist = Exercice::where('slug', 'playlist-musical')->first();
        if ($playlist && !$coursER->exercices()->where('exercice_id', $playlist->id)->exists()) {
            $coursER->exercices()->attach($playlist->id, ['order' => 1]);
        }

        Cours::firstOrCreate(
            ['nom' => 'Modéliser une BD en UML'],
            [
                'description' => 'Découvrez la modélisation de bases de données avec le formalisme UML.',
                'image'       => null,
                'visibility'  => false,
            ]
        );

        $this->command->info('Cours créés avec succès.');
    }
}
