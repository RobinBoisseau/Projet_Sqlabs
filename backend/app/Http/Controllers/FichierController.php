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
       $fichier = Fichier::create($request->all());
       return new FichierResource($fichier);
   }


   // GET /api/fichiers/{id}
   public function show($id)
   {
       $fichier = Fichier::find($id);
       if (!$fichierexercice) {
           return response()->json(['message' => 'Fichier non trouvé'], 404);
       }
       return new Fichier($fichier);
   }


   // PUT /api/fichiers/{id}
   public function update(Request $request, $id)
   {
       $fichier = Fichier::find($id);
       if (!$fichier) {
           return response()->json(['message' => 'Fichier non trouvé'], 404);
       }
       $fichier->update($request->all());
       return new Fichier($fichier);
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
