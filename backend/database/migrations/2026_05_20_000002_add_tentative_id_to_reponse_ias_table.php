<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::table('reponse_ias', function (Blueprint $table) {
            $table->foreignId('tentative_id')->nullable()->after('id')
                  ->constrained('tentatives')->onDelete('cascade');
        });
    }

    public function down(): void {
        Schema::table('reponse_ias', function (Blueprint $table) {
            $table->dropForeign(['tentative_id']);
            $table->dropColumn('tentative_id');
        });
    }
};
