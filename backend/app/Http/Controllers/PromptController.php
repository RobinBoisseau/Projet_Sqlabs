<?php

namespace App\Http\Controllers;

use App\Models\Prompt;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class PromptController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(Prompt::orderBy('categorie')->orderByDesc('actif')->get());
    }

    public function store(Request $request): JsonResponse
    {
        $categorie   = $request->categorie;
        $actif       = $request->boolean('actif');
        $forcedActif = false;

        // Si inactif demandé mais aucun prompt actif de cette catégorie → forcer actif
        if (!$actif && !Prompt::where('categorie', $categorie)->where('actif', true)->exists()) {
            $actif       = true;
            $forcedActif = true;
        }

        // Si actif → désactiver les autres de la même catégorie
        if ($actif) {
            Prompt::where('categorie', $categorie)->update(['actif' => false]);
        }

        $prompt = Prompt::create([
            'nom'       => $request->nom,
            'prompt'    => $request->prompt,
            'categorie' => $categorie,
            'actif'     => $actif,
        ]);

        return response()->json(['prompt' => $prompt, 'forced_actif' => $forcedActif], 201);
    }

    public function show(int $id): JsonResponse
    {
        return response()->json(Prompt::findOrFail($id));
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $prompt      = Prompt::findOrFail($id);
        $categorie   = $request->categorie ?? $prompt->categorie;
        $actif       = $request->has('actif') ? $request->boolean('actif') : $prompt->actif;
        $forcedActif = false;

        // Si inactif demandé mais aucun autre prompt actif de cette catégorie → forcer actif
        if (!$actif && !Prompt::where('categorie', $categorie)->where('actif', true)->where('id', '!=', $id)->exists()) {
            $actif       = true;
            $forcedActif = true;
        }

        // Si actif → désactiver les autres de la même catégorie
        if ($actif) {
            Prompt::where('categorie', $categorie)->where('id', '!=', $id)->update(['actif' => false]);
        }

        $prompt->update([
            'nom'       => $request->nom       ?? $prompt->nom,
            'prompt'    => $request->prompt    ?? $prompt->prompt,
            'categorie' => $categorie,
            'actif'     => $actif,
        ]);

        return response()->json(['prompt' => $prompt, 'forced_actif' => $forcedActif]);
    }

    public function destroy(int $id): JsonResponse
    {
        Prompt::destroy($id);
        return response()->json(['message' => 'Supprimé']);
    }
}
