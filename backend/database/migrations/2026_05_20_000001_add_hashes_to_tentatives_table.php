<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::table('tentatives', function (Blueprint $table) {
            $table->string('hash_dico', 64)->nullable()->after('modele');
            $table->string('hash_dep',  64)->nullable()->after('hash_dico');
            $table->string('hash_mcd',  64)->nullable()->after('hash_dep');
        });
    }

    public function down(): void {
        Schema::table('tentatives', function (Blueprint $table) {
            $table->dropColumn(['hash_dico', 'hash_dep', 'hash_mcd']);
        });
    }
};
