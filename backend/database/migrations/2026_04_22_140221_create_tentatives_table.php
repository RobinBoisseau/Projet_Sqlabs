<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::create('tentatives', function (Blueprint $table) {
            $table->id();
            $table->json('dictionnaire')->nullable();
            $table->json('dependance')->nullable();
            $table->json('modele')->nullable();
            $table->boolean('dictionnaireValide')->default(false);
            $table->boolean('dependanceValide')->default(false);
            $table->boolean('modeleValide')->default(false);
            $table->json('dictionnaireCorrige')->nullable();
            $table->json('dependanceCorrige')->nullable();
            $table->json('modeleCorrige')->nullable();
            $table->dateTime('dateHeureTentative')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void {
        Schema::dropIfExists('tentatives');
    }
};