<?php

namespace Database\Factories;
<<<<<<< HEAD

=======
use Illuminate\Support\Str;
use App\Models\Exercice;
>>>>>>> 4c1ce90b0119953c92c83bf3bf93f8cefa80c216
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class ExerciceFactory extends Factory
{
<<<<<<< HEAD
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
=======
    public function definition(): array{
    // 1. On stocke le texte dans $titre
    $titre = fake()->sentence(3);
     
    return [
        'titre' => $titre, // On utilise la variable
        'slug'  => \Illuminate\Support\Str::slug($titre), // On utilise la MÊME variable (avec un R)
        'enonce' => fake()->paragraph(),
        'type'   => fake()->randomElement(['SQL', 'BPMN']),
        'etat'   => fake()->randomElement(['Fini', 'Non fini']),
        'user_id' => fake()->numberBetween(1, 10),
    ];
}
}
>>>>>>> 4c1ce90b0119953c92c83bf3bf93f8cefa80c216
