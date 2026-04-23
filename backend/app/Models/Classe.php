<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Classe extends Model
{
    use HasFactory;

    // On définit les champs remplissables (selon ta migration)
    protected $fillable = [
        'nom',
        'mdp',
        'user_id'
    ];

    /**
     * Association "Inscrire"
     * Une classe contient plusieurs utilisateurs (élèves).
     */
    public function users(): BelongsToMany
    {
        // 'classe_user' est le nom de la table pivot que tu as créée
        return $this->belongsToMany(User::class, 'classe_user');
    }
}