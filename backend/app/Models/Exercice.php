<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Exercice extends Model
{
    use HasFactory;

    protected $fillable = ['titre', 'slug', 'enonce', 'type', 'etat', 'user_id'];

    // --- AJOUTE CETTE FONCTION ICI ---
    public function tentatives()
    {
        // Un exercice a plusieurs tentatives (HasMany)
        return $this->hasMany(Tentative::class);
    }

    protected static function boot()
    {
        parent::boot();
        static::creating(function ($exercice) {
            if (empty($exercice->slug)) {
                $exercice->slug = Str::slug($exercice->titre);
            }
        });
    }
}