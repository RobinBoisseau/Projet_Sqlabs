<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Tentative;
use App\Models\Exercice;
use Illuminate\Support\Facades\DB;

class ConcernerSeeder extends Seeder
{
    public function run()
    {
        $tentatives = Tentative::all();
        $exercices = Exercice::pluck('id'); // On récupère juste les IDs

        foreach ($tentatives as $tentative) {
            // On lie chaque tentative à 1 ou 2 exercices aléatoires
            $tentative->exercices()->attach(
                $exercices->random(rand(1, 2))
            );
        }
    }
}