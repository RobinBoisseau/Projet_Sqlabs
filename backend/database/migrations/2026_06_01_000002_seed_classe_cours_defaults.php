<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        $classes = DB::table('classes')->pluck('id');
        $cours   = DB::table('cours')->pluck('id');
        $now     = now();

        foreach ($classes as $classeId) {
            foreach ($cours as $order => $coursId) {
                $exists = DB::table('classe_cours')
                    ->where('classe_id', $classeId)
                    ->where('cours_id', $coursId)
                    ->exists();

                if (!$exists) {
                    DB::table('classe_cours')->insert([
                        'classe_id'  => $classeId,
                        'cours_id'   => $coursId,
                        'order'      => $order,
                        'created_at' => $now,
                        'updated_at' => $now,
                    ]);
                }
            }
        }
    }

    public function down(): void
    {
        DB::table('classe_cours')->truncate();
    }
};
