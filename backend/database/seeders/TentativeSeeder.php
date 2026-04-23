<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Tentative;

class TentativeSeeder extends Seeder
{
    public function run(): void
    {
        Tentative::factory()->count(20)->create();
    }
}