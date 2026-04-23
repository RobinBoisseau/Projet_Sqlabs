<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Classe;

class ClasseUserSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Récupérer tous les utilisateurs et toutes les classes
        $users = User::all();
        $classes = Classe::all();

        // Sécurité : Vérifier qu'on a bien des données
        if ($users->isEmpty() || $classes->isEmpty()) {
            $this->command->warn("Il manque des utilisateurs ou des classes pour faire l'inscription !");
            return;
        }

        // 2. Pour chaque utilisateur, on lui assigne des classes au hasard
        foreach ($users as $user) {
            // On prend entre 1 et 3 classes aléatoirement
            $classesToAssign = $classes->random(rand(1, 2))->pluck('id');

            // On utilise attach() pour remplir la table pivot
            // syncWithoutDetaching évite les doublons si on lance le seeder plusieurs fois
            $user->classes()->syncWithoutDetaching($classesToAssign);
        }

        $this->command->info("L'association Inscrire a été remplie avec succès !");
    }
}