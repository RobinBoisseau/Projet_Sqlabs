<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Tentative;

class EssayerSeeder extends Seeder
{
    public function run()
    {
        $etudiants = User::where('role', 'etudiant')->get();
        $tentatives = Tentative::pluck('id');

        foreach ($etudiants as $etudiant) {
            // Chaque étudiant a essayé entre 1 et 3 tentatives
            $etudiant->tentatives()->attach(
                $tentatives->random(rand(1, 3))
            );
        }
    }
}