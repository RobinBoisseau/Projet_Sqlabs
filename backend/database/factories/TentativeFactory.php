<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

class TentativeFactory extends Factory
{
    public function definition(): array
    {
        return [
            'dictionnaire' => json_encode(['mot1' => 'définition1', 'mot2' => 'définition2']),
            'dependance' => json_encode(['dep1', 'dep2']),
            'modele' => json_encode(['element1', 'element2']),
            'dictionnaireValide' => fake()->boolean(),
            'dependanceValide' => fake()->boolean(),
            'modeleValide' => fake()->boolean(),
            'dictionnaireCorrige' => json_encode(['mot1' => 'correction1']),
            'dependanceCorrige' => json_encode(['dep1corrige']),
            'modeleCorrige' => json_encode(['element1corrige']),
            'dateHeureTentative' => fake()->dateTimeBetween('-1 year', 'now'),
            'user_id' => fake()->numberBetween(1, 10),
            'exercice_id' => fake()->numberBetween(1, 20),
        ];
    }
}