<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use App\Models\Cours;

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

    public function responsables(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'classe_user')
                    ->wherePivot('role', 'responsable')
                    ->withPivot('role')
                    ->withTimestamps();
    }

    public function students(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'classe_user')
                    ->wherePivot('role', 'student')
                    ->withPivot('role')
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

    public function canManageMembers(User $user): bool
    {
        if ($user->role === 'admin') return true;
        return $this->creator()->where('user_id', $user->id)->exists()
            || $this->responsables()->where('user_id', $user->id)->exists();
    }

    public function cours(): BelongsToMany
    {
        return $this->belongsToMany(Cours::class, 'classe_cours')
                    ->withPivot('order')
                    ->orderByPivot('order')
                    ->withTimestamps();
    }

    public function isEnrolled(int $userId): bool
    {
        return \DB::table('classe_user')
            ->where('classe_id', $this->id)
            ->where('user_id', $userId)
            ->exists();
    }
}
