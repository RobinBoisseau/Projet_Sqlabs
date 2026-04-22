<?php

namespace App\Http\Controllers;

use App\Models\Exercice;
use App\Http\Resources\ExerciceResource;
use Illuminate\Http\Request;

class ExerciceController extends Controller
{
    // GET /api/exercices
    public function index()
    {
        $exercices = Exercice::all();
        return ExerciceResource::collection($exercices);
    }

    // POST /api/exercices
    public function store(Request $request)
    {
        $exercice = Exercice::create($request->all());
        return new ExerciceResource($exercice);
    }

    // GET /api/exercices/{id}
    public function show($id)
    {
        $exercice = Exercice::find($id);
        if (!$exercice) {
            return response()->json(['message' => 'Exercice non trouvé'], 404);
        }
        return new ExerciceResource($exercice);
    }

    // PUT /api/exercices/{id}
    public function update(Request $request, $id)
    {
        $exercice = Exercice::find($id);
        if (!$exercice) {
            return response()->json(['message' => 'Exercice non trouvé'], 404);
        }
        $exercice->update($request->all());
        return new ExerciceResource($exercice);
    }

    // DELETE /api/exercices/{id}
    public function destroy($id)
    {
        $exercice = Exercice::find($id);
        if (!$exercice) {
            return response()->json(['message' => 'Exercice non trouvé'], 404);
        }
        $exercice->delete();
        return response()->json(['message' => 'Exercice supprimé'], 200);
    }
}