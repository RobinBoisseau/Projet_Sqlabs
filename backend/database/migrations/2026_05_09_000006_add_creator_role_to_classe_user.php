<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        // Ajout de 'creator' dans l'enum
        DB::statement("ALTER TABLE classe_user MODIFY COLUMN role ENUM('creator','teacher','student') NOT NULL DEFAULT 'student'");

        // Les 'teacher' actuels viennent tous de la migration classes.user_id : ce sont les créateurs
        DB::table('classe_user')->where('role', 'teacher')->update(['role' => 'creator']);
    }

    public function down(): void
    {
        DB::table('classe_user')->where('role', 'creator')->update(['role' => 'teacher']);
        DB::statement("ALTER TABLE classe_user MODIFY COLUMN role ENUM('teacher','student') NOT NULL DEFAULT 'student'");
    }
};
