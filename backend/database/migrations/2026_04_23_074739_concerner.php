<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('concerner', function (Blueprint $table) {
            $table->foreignId('idTentative')->constrained('tentatives')->onDelete('cascade');
            $table->foreignId('idExercice')->constrained('exercices')->onDelete('cascade');

            // Définition de la clé primaire composée
            $table->primary(['idTentative', 'idExercice']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('essayer');
    }
};
