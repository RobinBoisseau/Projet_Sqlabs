<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::table('fichiers', function (Blueprint $table) {
            // La colonne exercice_id existe déjà, on ajoute uniquement la contrainte FK
            $table->foreign('exercice_id')->references('id')->on('exercices')->onDelete('cascade');
        });
    }

    public function down(): void {
        Schema::table('fichiers', function (Blueprint $table) {
            $table->dropForeign(['exercice_id']);
        });
    }
};
