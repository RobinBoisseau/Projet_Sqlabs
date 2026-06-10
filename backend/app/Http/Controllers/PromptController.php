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
        $prompt = Prompt::create([
            'nom'       => $request->nom,
            'prompt'    => $request->prompt,
            'categorie' => $request->categorie,
            'actif'     => $request->boolean('actif'),
            'poid'      => $request->boolean('poid'),
        ]);

        return response()->json($prompt, 201);
    }

    public function show(int $id): JsonResponse
    {
        return response()->json(Prompt::findOrFail($id));
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $prompt = Prompt::findOrFail($id);
        $prompt->update([
            'nom'       => $request->nom       ?? $prompt->nom,
            'prompt'    => $request->prompt    ?? $prompt->prompt,
            'categorie' => $request->categorie ?? $prompt->categorie,
            'actif'     => $request->has('actif') ? $request->boolean('actif') : $prompt->actif,
            'poid'      => $request->has('poid')  ? $request->boolean('poid')  : $prompt->poid,
        ]);

        return response()->json($prompt);
    }

    public function destroy(int $id): JsonResponse
    {
        Prompt::destroy($id);
        return response()->json(['message' => 'Supprimé']);
    }
}
