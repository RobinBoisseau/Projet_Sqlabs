<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::table('fichiers', function (Blueprint $table) {
            $table->string('contenu')->change();
        });
    }

    public function down(): void {
        Schema::table('fichiers', function (Blueprint $table) {
            $table->text('contenu')->change();
        });
    }
};
