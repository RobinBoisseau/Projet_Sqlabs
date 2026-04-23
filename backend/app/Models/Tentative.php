<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Tentative extends Model {
    use HasFactory;

    protected $fillable = [
        'dictionnaire', 'dependance', 'modele',
        'dictionnaireValide', 'dependanceValide', 'modeleValide',
        'dictionnaireCorrige', 'dependanceCorrige', 'modeleCorrige',
        'dateHeureTentative'
    ];

    // Important pour transformer le JSON en tableau PHP automatiquement
    protected $casts = [
        'dictionnaire' => 'array',
        'dependance' => 'array',
        'modele' => 'array',
        'dictionnaireCorrige' => 'array',
        'dependanceCorrige' => 'array',
        'modeleCorrige' => 'array',
        'dictionnaireValide' => 'boolean',
        'dependanceValide' => 'boolean',
        'modeleValide' => 'boolean',
        'dateHeureTentative' => 'datetime'
    ];

    public function etudiants() {
        return $this->belongsToMany(Utilisateur::class, 'essayer', 'idTentative', 'idEtudiant');
    }

    public function exercices() {
        return $this->belongsToMany(Exercice::class, 'concerner', 'idTentative', 'idExercice');
    }

}