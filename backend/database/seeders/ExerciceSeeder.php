<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Exercice; // <--- TRÈS IMPORTANT

class ExerciceSeeder extends Seeder
{
    public function run(): void
    {
        Exercice::factory()->count(20)->create();
    }
}