<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('classes', function (Blueprint $table) {
            $table->string('nom', 255)->change();
            $table->renameColumn('mdp', 'join_code');
        });

        Schema::table('classes', function (Blueprint $table) {
            $table->string('join_code', 255)->change();
        });

        // Hasher les codes existants en clair
        DB::table('classes')->get()->each(function ($classe) {
            DB::table('classes')->where('id', $classe->id)->update([
                'join_code' => Hash::make($classe->join_code),
            ]);
        });
    }

    public function down(): void
    {
        Schema::table('classes', function (Blueprint $table) {
            $table->string('nom', 10)->change();
            $table->renameColumn('join_code', 'mdp');
        });

        Schema::table('classes', function (Blueprint $table) {
            $table->string('mdp', 10)->change();
        });
    }
};
