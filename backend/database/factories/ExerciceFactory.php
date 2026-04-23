<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class ExerciceFactory extends Factory
{
    public function definition(): array
    {
        $titre = $this->faker->sentence(3);
        return [
            'titre'   => $titre,
            'slug'    => Str::slug($titre),
            'enonce'  => $this->faker->paragraph(),
            'type'    => $this->faker->randomElement(['SQL', 'BPMN']),
            'etat'    => $this->faker->randomElement(['Fini', 'Non fini']),
            'user_id' => $this->faker->numberBetween(1, 10),
        ];
    }
}