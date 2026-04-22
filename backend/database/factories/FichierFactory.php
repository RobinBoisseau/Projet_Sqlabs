<?php

namespace Database\Factories;

use App\Models\Fichier;
use Illuminate\Database\Eloquent\Factories\Factory;

class FichierFactory extends Factory
{
    public function definition(): array
    {
        return [
            'type' => $this->faker->randomElement(['.pdf', '.docx', '.jpeg', '.png']),
            'nom' => $this->faker->sentence(2),
            'contenu' => $this->faker->paragraph(2)
        ];
    }
}
