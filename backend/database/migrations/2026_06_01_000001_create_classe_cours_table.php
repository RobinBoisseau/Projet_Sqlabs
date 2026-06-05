<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('classe_cours', function (Blueprint $table) {
            $table->id();
            $table->foreignId('classe_id')->constrained('classes')->onDelete('cascade');
            $table->foreignId('cours_id')->constrained('cours')->onDelete('cascade');
            $table->integer('order')->default(0);
            $table->unique(['classe_id', 'cours_id']);
            $table->timestamps();
        });

        // Associer tous les cours existants à toutes les classes existantes
        $classes = DB::table('classes')->pluck('id');
        $cours   = DB::table('cours')->pluck('id');
        $now     = now();

        foreach ($classes as $classeId) {
            foreach ($cours as $order => $coursId) {
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

    public function down(): void
    {
        Schema::dropIfExists('classe_cours');
    }
};
