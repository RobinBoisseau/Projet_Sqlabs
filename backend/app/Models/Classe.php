<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Classe extends Model
{
    use HasFactory;

    protected $fillable = ['nom', 'description', 'image', 'visibility', 'join_code'];

    protected $hidden = ['join_code'];

    public function creator(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'classe_user')
                    ->wherePivot('role', 'creator')
                    ->withTimestamps();
    }

    public function teachers(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'classe_user')
                    ->wherePivot('role', 'teacher')
                    ->withTimestamps();
    }

    public function students(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'classe_user')
                    ->wherePivot('role', 'student')
                    ->withTimestamps();
    }

    public function isCreator(int $userId): bool
    {
        return $this->creator()->where('user_id', $userId)->exists();
    }

    public function isStaff(int $userId): bool
    {
        return $this->creator()->where('user_id', $userId)->exists()
            || $this->teachers()->where('user_id', $userId)->exists();
    }
}
