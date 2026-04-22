<?php
// app/Models/ReponseIA.php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ReponseIA extends Model
{
    use HasFactory;

    protected $table = 'reponse_ias';

    protected $fillable = [
        'element',
        'contenuJson',
        'reponseJson',
        'dateHeureReponse',
    ];

    protected $casts = [
        'contenuJson'       => 'array',
        'reponseJson'       => 'array',
        'dateHeureReponse'  => 'datetime',
    ];
}