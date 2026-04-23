<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run()
{
    $this->call([
        UserSeeder::class,
        ExerciceSeeder::class,
        ClasseSeeder::class,
        TentativeSeeder::class,
        ClasseUserSeeder::class,
        FichierSeeder::class,
        ReponseIASeeder::class,
        EssayerSeeder::class,     
        ConcernerSeeder::class,
        TentativeSeeder::class,
    ]);
}
}
