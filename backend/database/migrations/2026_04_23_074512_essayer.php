<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('essayer', function (Blueprint $table) {
            $table->foreignId('idEtudiant')->constrained('utilisateurs')->onDelete('cascade');
            $table->foreignId('idTentative')->constrained('tentatives')->onDelete('cascade');
            
            // Définition de la clé primaire composée
            $table->primary(['idEtudiant', 'idTentative']);
});
    }

    public function down(): void
    {
        Schema::dropIfExists('essayer');
    }
};
