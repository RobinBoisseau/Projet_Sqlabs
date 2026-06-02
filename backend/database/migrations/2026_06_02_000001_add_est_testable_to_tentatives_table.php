<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tentatives', function (Blueprint $table) {
            $table->boolean('est_testable')->default(false)->after('modeleValide');
        });
    }

    public function down(): void
    {
        Schema::table('tentatives', function (Blueprint $table) {
            $table->dropColumn('est_testable');
        });
    }
};
