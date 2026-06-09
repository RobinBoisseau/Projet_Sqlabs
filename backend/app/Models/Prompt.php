<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Prompt extends Model
{
    protected $fillable = ['nom', 'prompt', 'categorie', 'actif', 'poid'];

    protected $casts = [
        'actif' => 'boolean',
        'poid'  => 'integer',
    ];

    public function tests()
    {
        return $this->belongsToMany(Test::class, 'utiliser');
    }
}
