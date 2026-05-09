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
        $data['user_id']   = $request->user()->id;

        return new ClasseResource(Classe::create($data));
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

    public function destroy(int $id)
    {
        Classe::findOrFail($id)->delete();
        return response()->json(['message' => 'Classe supprimée'], 200);
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

        $classe->users()->syncWithoutDetaching($request->user()->id);

        return new ClasseResource($classe);
    }
}
