<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Exercice extends Model
{
    use HasFactory;

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
}