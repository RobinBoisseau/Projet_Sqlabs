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

        $user->update($data);
        return new UserResource($user);
    }

    // DELETE /api/users/{id}
    public function destroy(int $id)
    {
        $user = User::find($id);
        if (!$user) {
            return response()->json(['message' => 'Utilisateur non trouvé'], 404);
        }
        $user->delete();
        return response()->json(['message' => 'Utilisateur supprimé'], 200);
    }
}