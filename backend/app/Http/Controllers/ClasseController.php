<?php

namespace App\Http\Controllers;

use App\Models\Classe;
use App\Http\Resources\ClasseResource;
use Illuminate\Http\Request;

class ClasseController extends Controller
{
    public function index()
    {
        return ClasseResource::collection(Classe::all());
    }

    public function store(Request $request)
    {
        $request->validate([
            'nom' => 'required|max:10',
            'mdp' => 'required|max:10',
        ]);

        $classe = Classe::create($request->all());
        return new ClasseResource($classe);
    }

    public function show($id)
    {
        $classe = Classe::findOrFail($id);
        return new ClasseResource($classe);
    }

    public function update(Request $request, $id)
    {
        $classe = Classe::findOrFail($id);
        $classe->update($request->all());
        return new ClasseResource($classe);
    }

    public function destroy($id)
    {
        $classe = Classe::findOrFail($id);
        $classe->delete();
        return response()->json(['message' => 'Classe supprimée'], 200);
    }
}