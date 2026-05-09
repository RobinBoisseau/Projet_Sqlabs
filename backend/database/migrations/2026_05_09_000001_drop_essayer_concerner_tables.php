<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::dropIfExists('essayer');
        Schema::dropIfExists('concerner');
    }

    public function down(): void
    {
        Schema::create('essayer', function ($table) {
            $table->foreignId('idEtudiant')->constrained('users')->onDelete('cascade');
            $table->foreignId('idTentative')->constrained('tentatives')->onDelete('cascade');
            $table->primary(['idEtudiant', 'idTentative']);
        });

        Schema::create('concerner', function ($table) {
            $table->foreignId('idTentative')->constrained('tentatives')->onDelete('cascade');
            $table->foreignId('idExercice')->constrained('exercices')->onDelete('cascade');
            $table->primary(['idTentative', 'idExercice']);
        });
    }
};
