<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Cours;

class CoursSeeder extends Seeder
{
    public function run(): void
    {
        Cours::firstOrCreate(
            ['nom' => 'Modéliser une BD entité relation'],
            [
                'description' => 'Apprenez à concevoir un modèle entité-relation à partir d\'un énoncé.',
                'image'       => null,
                'visibility'  => true,
            ]
        );

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
