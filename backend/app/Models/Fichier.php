<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Fichier extends Model
{
    use HasFactory;

    protected $fillable = [
        'exercice_id',
        'type',
        'nom',
        'contenu',
    ];

    public function exercice()
    {
        return $this->belongsTo(Exercice::class);
    }
}
