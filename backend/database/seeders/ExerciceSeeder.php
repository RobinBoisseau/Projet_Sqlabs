<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Exercice;

class ExerciceSeeder extends Seeder
{
    public function run()
    {
        // Utilise la factory pour créer 20 exercices en BDD
        Exercice::factory()->count(20)->create();
    }
}
