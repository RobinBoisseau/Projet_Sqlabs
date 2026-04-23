<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Fichier;

class FichierSeeder extends Seeder
{
    public function run(): void
    {
        Fichier::factory()->count(10)->create();
    }
}
