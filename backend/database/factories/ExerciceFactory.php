<?php

namespace Database\Factories;
use Illuminate\Support\Str;
use App\Models\Exercice;
use Illuminate\Database\Eloquent\Factories\Factory;

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
