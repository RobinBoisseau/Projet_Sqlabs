<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Http\Resources\UserResource;
use Illuminate\Http\Request;

class UserController extends Controller
{
    // GET /api/users
    public function index()
    {
        $users = User::all();
        return UserResource::collection($users);
    }

    // POST /api/users
    public function store(Request $request)
    {
        $user = User::create($request->all());
        return new UserResource($user);
    }

    // GET /api/users/{id}
    public function show(int $id)
    {
        $user = User::find($id);
        if (!$user) {
            return response()->json(['message' => 'Utilisateur non trouvé'], 404);
        }
        return new UserResource($user);
    }

    // PUT /api/users/{id}
    public function update(Request $request, int $id)
    {
        $user = User::find($id);
        if (!$user) {
            return response()->json(['message' => 'Utilisateur non trouvé'], 404);
        }

        $data = $request->validate([
            'name'  => 'sometimes|string|max:255',
            'email' => "sometimes|email|unique:users,email,{$id}",
            'role'  => 'sometimes|in:etudiant,professeur,admin',
        ]);

        if (isset($data['role']) && $data['role'] !== $user->role) {
            // Un admin ne peut pas modifier son propre rôle
            if ($request->user()->id === $user->id) {
                return response()->json(['message' => 'Vous ne pouvez pas modifier votre propre rôle.'], 403);
            }

            // Impossible de retirer le rôle admin au dernier administrateur
            if ($user->role === 'admin' && User::where('role', 'admin')->count() <= 1) {
                return response()->json(['message' => 'Impossible de modifier le rôle du dernier administrateur.'], 403);
            }
        }

        $user->update($data);
        return new UserResource($user);
    }

    // DELETE /api/users/{id}
    public function destroy(Request $request, int $id)
    {
        $user = User::find($id);
        if (!$user) {
            return response()->json(['message' => 'Utilisateur non trouvé'], 404);
        }

        // Un admin ne peut pas supprimer son propre compte
        if ($request->user()->id === $user->id) {
            return response()->json(['message' => 'Vous ne pouvez pas supprimer votre propre compte.'], 403);
        }

        // Impossible de supprimer le dernier administrateur
        if ($user->role === 'admin' && User::where('role', 'admin')->count() <= 1) {
            return response()->json(['message' => 'Impossible de supprimer le dernier administrateur.'], 403);
        }

        $user->delete();
        return response()->json(['message' => 'Utilisateur supprimé'], 200);
    }
}
