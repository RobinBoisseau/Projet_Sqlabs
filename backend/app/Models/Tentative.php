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

    // Une tentative concerne plusieurs exercices
    public function exercices() {
        return $this->belongsToMany(Exercice::class, 'concerner', 'idTentative', 'idExercice');
    }

    // Une tentative est essayée par plusieurs étudiants (si c'est bien le sens de ta table)
    public function users() {
        return $this->belongsToMany(Utilisateur::class, 'essayer', 'idTentative', 'idEtudiant');
    }
}