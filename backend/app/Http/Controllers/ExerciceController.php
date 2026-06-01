<?php

namespace App\Http\Controllers;

use App\Models\Exercice;
use App\Http\Resources\ExerciceResource;
use Illuminate\Http\Request;
use App\Models\Tentative;

class ExerciceController extends Controller
{
    // GET /api/exercices
    public function index()
    {
        $user = auth()->user();

        if ($user && ($user->role === 'admin' || $user->role === 'professeur')) {
            $exercices = Exercice::all();
        } else {
            $exercices = Exercice::where('visibility', true)->get();
        }

        return ExerciceResource::collection($exercices);
    }

    // POST /api/exercices
    public function store(Request $request)
{
    $validated = $request->validate([
        'titre'        => 'required|string|max:100',
        'enonce'       => 'required|string',
        'type'         => 'required|in:SQL,BPMN',
        'etat'         => 'sometimes|string|in:Fini,Non fini',
        'dictionary'   => 'nullable|array',
        'dependencies' => 'nullable|array',
        'model'        => 'nullable|array',
    ]);

    // Génération du slug
    $slug = \Str::slug($validated['titre']);
    $base = $slug;
    $i = 1;
    while (Exercice::where('slug', $slug)->exists()) {
        $slug = $base . '-' . $i++;
    }

    $exercice = Exercice::create([
        'titre'   => $validated['titre'],
        'slug'    => $slug,
        'enonce'  => $this->purifyHtml($validated['enonce']),
        'type'    => $validated['type'],
        'etat'    => $validated['etat'] ?? 'Non fini',
        'user_id' => auth()->id(),
    ]);

    // Créer la tentative correction si dico/deps/MCD fournis
    if (!empty($validated['dictionary']) || !empty($validated['model'])) {
        Tentative::create([
            'exercice_id'    => $exercice->id,
            'user_id'        => auth()->id(),
            'is_correction'  => true,
            'dictionnaire'   => $validated['dictionary'] ?? [],
            'dependance'     => $validated['dependencies'] ?? [],
            'modele'         => $validated['model'] ?? [],
            'dateHeureTentative' => now(),
        ]);
    }

    return new ExerciceResource($exercice);
}

    // GET /api/exercices/{slug}
    // CORRIGÉ : Recherche par slug sans erreur de syntaxe
    public function show($slug)
    {
        // On cherche par le champ slug
        $exercice = Exercice::where('slug', $slug)->first();

        if (!$exercice) {
            return response()->json(['message' => 'Exercice non trouvé'], 404);
        }

        return new ExerciceResource($exercice);
    }

    // GET /api/exercices/{slug}/correction
    public function getCorrection($slug)
    {
        $exercice = Exercice::where('slug', $slug)->firstOrFail();
        $correction = Tentative::where('exercice_id', $exercice->id)
            ->where('is_correction', true)
            ->first();
        return response()->json([
            'exercice'   => new ExerciceResource($exercice),
            'correction' => $correction ? [
                'dictionary'   => $correction->dictionnaire,
                'dependencies' => $correction->dependance,
                'model'        => $correction->modele,
            ] : null,
        ]);
    }

    // PUT /api/exercices/{slug}/correction
    public function updateWithCorrection(Request $request, $slug)
    {
        $exercice = Exercice::where('slug', $slug)->firstOrFail();

        $validated = $request->validate([
            'titre'        => 'sometimes|string|max:100',
            'enonce'       => 'sometimes|string',
            'type'         => 'sometimes|in:SQL,BPMN',
            'etat'         => 'sometimes|string|in:Fini,Non fini',
            'dictionary'   => 'nullable|array',
            'dependencies' => 'nullable|array',
            'model'        => 'nullable|array',
        ]);

        $exercice->update([
            'titre'  => $validated['titre']  ?? $exercice->titre,
            'enonce' => isset($validated['enonce']) ? $this->purifyHtml($validated['enonce']) : $exercice->enonce,
            'type'   => $validated['type']   ?? $exercice->type,
            'etat'   => $validated['etat']   ?? $exercice->etat,
        ]);

        Tentative::updateOrCreate(
            ['exercice_id' => $exercice->id, 'is_correction' => true],
            [
                'user_id'            => auth()->id(),
                'dictionnaire'       => $validated['dictionary'] ?? [],
                'dependance'         => $validated['dependencies'] ?? [],
                'modele'             => $validated['model'] ?? [],
                'dateHeureTentative' => now(),
            ]
        );

        return new ExerciceResource($exercice);
    }

    // PUT /api/exercices/{id}
    public function update(Request $request, $id)
    {
        $exercice = Exercice::find($id);
        if (!$exercice) {
            return response()->json(['message' => 'Exercice non trouvé'], 404);
        }
        $validated = $request->validate([
            'titre'      => 'sometimes|string|max:100',
            'enonce'     => 'sometimes|string',
            'type'       => 'sometimes|in:SQL,BPMN',
            'etat'       => 'sometimes|string|in:Fini,Non fini',
            'visibility' => 'sometimes|boolean',
        ]);
        if (isset($validated['enonce'])) {
            $validated['enonce'] = $this->purifyHtml($validated['enonce']);
        }
        $exercice->update($validated);
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

    public function showBySlug($slug){
        // On cherche l'exercice par le slug
        $exercice = Exercice::where('slug', $slug)->first();

        if (!$exercice) {
            return response()->json(['message' => 'Exercice non trouvé en base'], 404);
        }

        return new ExerciceResource($exercice);
    }

    private function purifyHtml(string $html): string
    {
        $allowed = '<p><br><strong><em><u><s><ol><ul><li><h1><h2><h3><span><a><blockquote><pre><code>';
        $clean = strip_tags($html, $allowed);
        $clean = preg_replace('/\s+on\w+\s*=\s*("[^"]*"|\'[^\']*\')/i', '', $clean);
        return preg_replace('/\s+href\s*=\s*"javascript:[^"]*"/i', ' href="#"', $clean);
    }
}