<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Exercice extends Model
{
    use HasFactory;

    protected $fillable = [
        'titre',
        'enonce',
        'type',
        'etat',
        'user_id',
    ];

    public function getRouteKeyName()
{
    return 'slug';
}
}