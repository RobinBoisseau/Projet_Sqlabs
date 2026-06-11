<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Prompt extends Model
{
    protected $fillable = ['nom', 'prompt', 'categorie', 'actif'];

    protected $casts = [
        'actif' => 'boolean',
    ];

    public function tests()
    {
        return $this->belongsToMany(Test::class, 'utiliser');
    }
}
