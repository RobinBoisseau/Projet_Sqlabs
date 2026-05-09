<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tentatives', function (Blueprint $table) {
            // Un corrigé est une tentative sans étudiant associé
            $table->boolean('is_correction')->default(false)->after('id');

            // user_id nullable : les corrigés n'appartiennent pas à un étudiant
            $table->foreignId('user_id')->nullable()->change();

            // Les données corrigées n'ont pas leur place ici : le corrigé est sa propre tentative
            $table->dropColumn(['dictionnaireCorrige', 'dependanceCorrige', 'modeleCorrige']);
        });
    }

    public function down(): void
    {
        Schema::table('tentatives', function (Blueprint $table) {
            $table->dropColumn('is_correction');
            $table->foreignId('user_id')->nullable(false)->change();
            $table->json('dictionnaireCorrige')->nullable();
            $table->json('dependanceCorrige')->nullable();
            $table->json('modeleCorrige')->nullable();
        });
    }
};
