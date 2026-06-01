<?php

namespace App\Http\Controllers;

use App\Models\Fichier;
use App\Http\Resources\FichierResource;
use Illuminate\Http\Request;

class FichierController extends Controller
{
    // GET /api/fichiers
    public function index()
    {
       $fichiers = Fichier::all();
       return FichierResource::collection($fichiers);
    }

// POST /api/fichiers
   public function store(Request $request)
   {
       $validated = $request->validate([
           'exercice_id' => 'required|exists:exercices,id',
           'type'        => 'required|string|max:50',
           'nom'         => 'required|string|max:255',
           'contenu'     => 'required|string',
       ]);
       $fichier = Fichier::create($validated);
       return new FichierResource($fichier);
   }


   // GET /api/fichiers/{id}
   public function show($id)
   {
       $fichier = Fichier::find($id);
       if (!$fichier) {
           return response()->json(['message' => 'Fichier non trouvé'], 404);
       }
       return new FichierResource($fichier);
   }


   // PUT /api/fichiers/{id}
   public function update(Request $request, $id)
   {
       $fichier = Fichier::find($id);
       if (!$fichier) {
           return response()->json(['message' => 'Fichier non trouvé'], 404);
       }
       $validated = $request->validate([
           'type'    => 'sometimes|string|max:50',
           'nom'     => 'sometimes|string|max:255',
           'contenu' => 'sometimes|string',
       ]);
       $fichier->update($validated);
       return new FichierResource($fichier);
   }


   // DELETE /api/fichiers/{id}
   public function destroy($id)
   {
       $fichier = Fichier::find($id);
       if (!$fichier) {
           return response()->json(['message' => 'Fichier non trouvé'], 404);
       }
       $fichier->delete();
       return response()->json(['message' => 'Fichier supprimé'], 200);
   }
}
