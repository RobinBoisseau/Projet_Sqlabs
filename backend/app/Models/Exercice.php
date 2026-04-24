<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Exercice extends Model
{
    use HasFactory;

<<<<<<< HEAD
    protected $fillable = ['titre', 'slug', 'enonce', 'type', 'etat', 'user_id'];

    protected static function boot()
    {
        parent::boot();
        static::creating(function ($exercice) {
            if (empty($exercice->slug)) {
                $exercice->slug = Str::slug($exercice->titre);
            }
        });
    }
=======
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
>>>>>>> 4c1ce90b0119953c92c83bf3bf93f8cefa80c216
}