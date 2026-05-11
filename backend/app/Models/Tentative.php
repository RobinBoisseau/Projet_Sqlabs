<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Tentative extends Model {
    use HasFactory;

    protected $fillable = [
        'is_correction',
        'dictionnaire', 'dependance', 'modele',
        'dictionnaireValide', 'dependanceValide', 'modeleValide',
        'dateHeureTentative', 'user_id', 'exercice_id',
    ];

    protected $casts = [
        'is_correction'    => 'boolean',
        'dictionnaire'     => 'array',
        'dependance'       => 'array',
        'modele'           => 'array',
        'dictionnaireValide' => 'boolean',
        'dependanceValide'   => 'boolean',
        'modeleValide'       => 'boolean',
        'dateHeureTentative' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function exercice()
    {
        return $this->belongsTo(Exercice::class);
    }

}