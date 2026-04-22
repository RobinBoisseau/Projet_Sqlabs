<?php

namespace Database\Factories;

use App\Models\Exercice;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends Factory<Exercice>
 */
class ExerciceFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition()
{
    return [
        'titre' => fake()->sentence(3),
        'enonce' => fake()->paragraph(),
        'type' => fake()->randomElement(['SQL','BPMN']),
        'etat' => fake()->randomElement(['Fini', 'Non fini']),
    ];
}
}
