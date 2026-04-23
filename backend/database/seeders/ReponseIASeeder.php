<?php
// database/seeders/ReponseIASeeder.php

namespace Database\Seeders;

use App\Models\ReponseIA;
use Illuminate\Database\Seeder;

class ReponseIASeeder extends Seeder
{
    public function run(): void
    {
        ReponseIA::factory()->count(20)->create();
    }
}