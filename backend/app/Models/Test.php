<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Test extends Model
{
    protected $fillable = ['nom'];

    public function prompts()
    {
        return $this->belongsToMany(Prompt::class, 'utiliser');
    }
}
