<?php
// database/migrations/xxxx_xx_xx_create_reponse_ias_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('reponse_ias', function (Blueprint $table) {
            $table->id();
            $table->string('element', 15);
            $table->json('contenuJson');
            $table->json('reponseJson');
            $table->dateTime('dateHeureReponse');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('reponse_ias');
    }
};