<?php

namespace App\Http\Controllers;

use App\Models\Classe;
use App\Http\Resources\ClasseResource;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class ClasseController extends Controller
{
    public function index()
    {
        return ClasseResource::collection(Classe::all());
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'nom'       => 'required|string|max:255',
            'join_code' => 'required|string|min:4|max:255',
        ]);

        $data['join_code'] = Hash::make($data['join_code']);

        $classe = Classe::create($data);
        $classe->creator()->attach($request->user()->id);

        return new ClasseResource($classe);
    }

    public function show(int $id)
    {
        return new ClasseResource(Classe::findOrFail($id));
    }

    public function update(Request $request, int $id)
    {
        $classe = Classe::findOrFail($id);

        $data = $request->validate([
            'nom'       => 'sometimes|string|max:255',
            'join_code' => 'sometimes|string|min:4|max:255',
        ]);

        if (isset($data['join_code'])) {
            $data['join_code'] = Hash::make($data['join_code']);
        }

        $classe->update($data);
        return new ClasseResource($classe);
    }

    public function destroy(Request $request, int $id)
    {
        $classe = Classe::findOrFail($id);

        if (!$classe->isCreator($request->user()->id)) {
            return response()->json(['message' => 'Seul le créateur peut supprimer cette classe.'], 403);
        }

        $classe->delete();
        return response()->json(['message' => 'Classe supprimée'], 200);
    }

    public function addTeacher(Request $request, int $id)
    {
        $classe = Classe::findOrFail($id);

        if (!$classe->isCreator($request->user()->id)) {
            return response()->json(['message' => 'Seul le créateur peut ajouter des enseignants.'], 403);
        }

        $data = $request->validate(['user_id' => 'required|exists:users,id']);

        $classe->teachers()->syncWithoutDetaching($data['user_id']);

        return response()->json(['message' => 'Enseignant ajouté.']);
    }

    public function removeTeacher(Request $request, int $id)
    {
        $classe = Classe::findOrFail($id);

        if (!$classe->isCreator($request->user()->id)) {
            return response()->json(['message' => 'Seul le créateur peut retirer des enseignants.'], 403);
        }

        $data = $request->validate(['user_id' => 'required|exists:users,id']);

        $classe->teachers()->detach($data['user_id']);

        return response()->json(['message' => 'Enseignant retiré.']);
    }

    public function join(Request $request)
    {
        $data = $request->validate([
            'join_code' => 'required|string',
        ]);

        $classe = Classe::all()->first(
            fn($c) => Hash::check($data['join_code'], $c->join_code)
        );

        if (!$classe) {
            return response()->json(['message' => 'Code incorrect.'], 422);
        }

        $classe->students()->syncWithoutDetaching($request->user()->id);

        return new ClasseResource($classe);
    }
}
