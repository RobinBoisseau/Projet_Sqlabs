<?php
// database/factories/ReponseIAFactory.php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

class ReponseIAFactory extends Factory
{
    public function definition(): array
    {
        return [
            'element'          => $this->faker->lexify('???????????????'), // 15 chars max
            'contenuJson'      => [
                'prompt'   => $this->faker->sentence(),
                'contexte' => $this->faker->word(),
            ],
            'reponseJson'      => [
                'texte'      => $this->faker->paragraph(),
                'confidence' => $this->faker->randomFloat(2, 0, 1),
            ],
            'dateHeureReponse' => $this->faker->dateTimeBetween('-1 year', 'now'),
        ];
    }
}