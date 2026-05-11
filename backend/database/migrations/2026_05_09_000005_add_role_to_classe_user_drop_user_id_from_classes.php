<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Ajouter le rôle dans le pivot
        Schema::table('classe_user', function (Blueprint $table) {
            $table->enum('role', ['teacher', 'student'])->default('student')->after('classe_id');
            $table->unique(['user_id', 'classe_id']);
        });

        // 2. Migrer les enseignants actuels (classes.user_id) vers le pivot
        DB::table('classes')->get()->each(function ($classe) {
            DB::table('classe_user')->updateOrInsert(
                ['user_id' => $classe->user_id, 'classe_id' => $classe->id],
                ['role' => 'teacher', 'created_at' => now(), 'updated_at' => now()]
            );
        });

        // 3. Supprimer user_id de classes
        Schema::table('classes', function (Blueprint $table) {
            $table->dropForeign(['user_id']);
            $table->dropColumn('user_id');
        });
    }

    public function down(): void
    {
        Schema::table('classes', function (Blueprint $table) {
            $table->foreignId('user_id')->constrained('users');
        });

        DB::table('classe_user')->where('role', 'teacher')->get()->each(function ($row) {
            DB::table('classes')->where('id', $row->classe_id)
                ->update(['user_id' => $row->user_id]);
        });

        Schema::table('classe_user', function (Blueprint $table) {
            $table->dropUnique(['user_id', 'classe_id']);
            $table->dropColumn('role');
        });
    }
};
