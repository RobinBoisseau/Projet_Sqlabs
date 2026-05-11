<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement("ALTER TABLE classe_user MODIFY COLUMN role ENUM('creator','teacher','responsable','student') NOT NULL DEFAULT 'student'");
    }

    public function down(): void
    {
        DB::table('classe_user')->where('role', 'responsable')->update(['role' => 'student']);
        DB::statement("ALTER TABLE classe_user MODIFY COLUMN role ENUM('creator','teacher','student') NOT NULL DEFAULT 'student'");
    }
};
