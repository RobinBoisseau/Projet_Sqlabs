<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('classes', function (Blueprint $table) {
            $table->text('description')->nullable()->after('nom');
            $table->string('image')->nullable()->after('description');
            $table->enum('visibility', ['public', 'private'])->default('public')->after('image');
        });

        // Le code est un code d'accès partagé, pas un mot de passe : stockage en clair
        // Les hash bcrypt existants sont remplacés par de nouveaux codes lisibles
        DB::table('classes')->get()->each(function ($classe) {
            DB::table('classes')->where('id', $classe->id)
                ->update(['join_code' => strtoupper(Str::random(6))]);
        });

        Schema::table('classes', function (Blueprint $table) {
            $table->string('join_code', 8)->change();
        });
    }

    public function down(): void
    {
        Schema::table('classes', function (Blueprint $table) {
            $table->dropColumn(['description', 'image', 'visibility']);
            $table->string('join_code', 255)->change();
        });
    }
};
