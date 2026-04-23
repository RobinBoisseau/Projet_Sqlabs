<?php
// app/Http/Controllers/ReponseIAController.php

namespace App\Http\Controllers;

use App\Models\ReponseIA;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class ReponseIAController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json(ReponseIA::all());
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'element'          => 'required|string|max:15',
            'contenuJson'      => 'required|array',
            'reponseJson'      => 'required|array',
            'dateHeureReponse' => 'required|date',
        ]);

        $reponse = ReponseIA::create($validated);

        return response()->json($reponse, 201);
    }

    public function show(ReponseIA $reponseIA): JsonResponse
    {
        return response()->json($reponseIA);
    }

    public function update(Request $request, ReponseIA $reponseIA): JsonResponse
    {
        $validated = $request->validate([
            'element'          => 'sometimes|string|max:15',
            'contenuJson'      => 'sometimes|array',
            'reponseJson'      => 'sometimes|array',
            'dateHeureReponse' => 'sometimes|date',
        ]);

        $reponseIA->update($validated);

        return response()->json($reponseIA);
    }

    public function destroy(ReponseIA $reponseIA): JsonResponse
    {
        $reponseIA->delete();

        return response()->json(null, 204);
    }
}