<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class ClasseFactory extends Factory
{
    public function definition(): array
    {
        return [
            // On génère un mot aléatoire et on le coupe à 10 caractères au cas où
            'nom' => Str::limit($this->faker->word(), 10, ''),
            
            // On génère un mot de passe simple de 8 caractères
            'mdp' => Str::random(10),
        ];
    }
}