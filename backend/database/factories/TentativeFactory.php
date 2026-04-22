<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

class TentativeFactory extends Factory {
    public function definition(): array {
        return [
            'dictionnaire' => ['word' => 'test'],
            'dependance' => ['link' => 'none'],
            'modele' => ['schema' => 'default'],
            'dictionnaireValide' => $this->faker->boolean(),
            'dateHeureTentative' => now(),
        ];
    }
}