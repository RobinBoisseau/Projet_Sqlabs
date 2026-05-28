<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Exercice extends Model
{
    use HasFactory;

    protected $fillable = [
        'titre',
        'enonce',
        'slug',
        'type',
        'etat',
        'visibility',
        'user_id',
    ];

    protected $casts = [
        'visibility' => 'boolean',
    ];

    public function getRouteKeyName(){
    return 'slug';
    }

    public function tentatives()
    {
        return $this->hasMany(Tentative::class);
    }

    public function cours()
    {
        return $this->belongsToMany(Cours::class, 'cours_exercice')
                    ->withPivot('order')
                    ->withTimestamps();
    }
}
