<?php

namespace Database\Seeders;

use App\Models\Classe;
use Illuminate\Database\Seeder;

class ClasseSeeder extends Seeder
{
    public function run(): void
    {
        // Crée 10 enregistrements dans la table classes
        Classe::factory()->count(10)->create();
    }
}