<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Exercice extends Model
{
    use HasFactory;

    protected $fillable = [
        'titre',
        'enonce',
        'slug',
        'type',
        'etat',
        'user_id',
    ];

    public function getRouteKeyName(){
    return 'slug';
    }

    public function tentatives(): BelongsToMany
    {
        // On précise : Modèle lié, nom de la table pivot, clé de l'exo, clé de la tentative
        return $this->belongsToMany(Tentative::class, 'concerner', 'idExercice', 'idTentative');
    }
}