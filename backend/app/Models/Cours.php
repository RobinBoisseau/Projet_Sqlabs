<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use App\Models\Classe;

class Cours extends Model
{
    use HasFactory;

    protected $fillable = ['nom', 'description', 'image', 'visibility'];

    protected $casts = ['visibility' => 'boolean'];

    public function exercices(): BelongsToMany
    {
        return $this->belongsToMany(Exercice::class, 'cours_exercice')
                    ->withPivot('order')
                    ->orderByPivot('order')
                    ->withTimestamps();
    }

    public function classes(): BelongsToMany
    {
        return $this->belongsToMany(Classe::class, 'classe_cours')
                    ->withPivot('order')
                    ->withTimestamps();
    }
}
