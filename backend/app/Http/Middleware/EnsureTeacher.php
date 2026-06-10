<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class EnsureTeacher
{
    public function handle(Request $request, Closure $next)
    {
        $role = $request->user()?->role;
        if ($role !== 'admin' && $role !== 'professeur') {
            return response()->json(['message' => 'Accès réservé aux professeurs et administrateurs.'], 403);
        }
        return $next($request);
    }
}
