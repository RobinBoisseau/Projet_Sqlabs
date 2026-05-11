<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class ClasseFactory extends Factory
{
    public function definition(): array
    {
        return [
            'nom'         => fake()->words(2, true),
            'description' => fake()->optional()->sentence(),
            'image'       => null,
            'visibility'  => fake()->randomElement(['public', 'private']),
            'join_code'   => strtoupper(Str::random(6)),
        ];
    }
}
