<?php

namespace Database\Factories;
use Illuminate\Support\Str;
use App\Models\Exercice;
use Illuminate\Database\Eloquent\Factories\Factory;

class ExerciceFactory extends Factory
{
    public function definition(): array{
    // 1. On stocke le texte dans $titre
    $titre = fake()->sentence(3);
     
    return [
        'titre' => $titre, // On utilise la variable
        'slug'  => \Illuminate\Support\Str::slug($titre), // On utilise la MÊME variable (avec un R)
        'enonce' => fake()->paragraph(),
        'type'   => fake()->randomElement(['SQL', 'BPMN']),
        'etat'   => fake()->randomElement(['Fini', 'Non fini']),
        'type'   => fake()->randomElement(['SQL', 'BPMN']),
        'etat'   => fake()->randomElement(['Fini', 'Non fini']),
        'user_id' => fake()->numberBetween(1, 10),
    ];
}
}
