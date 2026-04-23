<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
{
    Schema::create('classe_user', function (Blueprint $table) {
        $table->id();
        
        // Clé étrangère vers la table users
        $table->foreignId('user_id')->constrained()->onDelete('cascade');
        
        // Clé étrangère vers la table classes
        $table->foreignId('classe_id')->constrained()->onDelete('cascade');
        
        $table->timestamps();
    });
}
    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('classe_user');
    }
};
