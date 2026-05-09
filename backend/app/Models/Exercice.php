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
        'user_id',
    ];

    public function getRouteKeyName(){
    return 'slug';
    }

    public function tentatives()
    {
        return $this->hasMany(Tentative::class);
    }
}