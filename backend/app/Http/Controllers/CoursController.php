<?php

namespace App\Http\Controllers;

use App\Models\Cours;
use App\Models\Tentative;
use App\Http\Resources\CoursResource;
use Illuminate\Http\Request;

class CoursController extends Controller
{
    public function index()
    {
        $cours = Cours::withCount('exercices')->get();
        return CoursResource::collection($cours);
    }

    public function show(Cours $cours)
    {
        $cours->load('exercices');
        return new CoursResource($cours);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'nom'         => 'required|string|max:255',
            'description' => 'required|string',
            'image'       => 'nullable|url|max:2048',
            'visibility'  => 'boolean',
            'exercices'   => 'nullable|array',
            'exercices.*.id'    => 'required|exists:exercices,id',
            'exercices.*.order' => 'required|integer|min:0',
        ]);

        $cours = Cours::create([
            'nom'         => $data['nom'],
            'description' => $data['description'],
            'image'       => $data['image'] ?? null,
            'visibility'  => $data['visibility'] ?? true,
        ]);

        if (!empty($data['exercices'])) {
            $sync = [];
            foreach ($data['exercices'] as $ex) {
                $sync[$ex['id']] = ['order' => $ex['order']];
            }
            $cours->exercices()->sync($sync);
        }

        $cours->load('exercices');
        return new CoursResource($cours);
    }

    public function update(Request $request, Cours $cours)
    {
        $data = $request->validate([
            'nom'         => 'sometimes|string|max:255',
            'description' => 'sometimes|string',
            'image'       => 'nullable|url|max:2048',
            'visibility'  => 'boolean',
        ]);

        $cours->update($data);
        $cours->load('exercices');
        return new CoursResource($cours);
    }

    public function updateExercices(Request $request, Cours $cours)
    {
        $data = $request->validate([
            'exercices'         => 'required|array',
            'exercices.*.id'    => 'required|exists:exercices,id',
            'exercices.*.order' => 'required|integer|min:0',
        ]);

        $sync = [];
        foreach ($data['exercices'] as $ex) {
            $sync[$ex['id']] = ['order' => $ex['order']];
        }
        $cours->exercices()->sync($sync);

        $cours->load('exercices');
        return new CoursResource($cours);
    }

    public function stats(Cours $cours)
    {
        $cours->load('exercices');
        $exerciceIds   = $cours->exercices->pluck('id');
        $totalExercices = $exerciceIds->count();

        if ($totalExercices === 0) {
            return response()->json(['data' => [
                'visibility'      => $cours->visibility,
                'exercices_count' => 0,
                'started'         => 0,
                'completed'       => 0,
            ]]);
        }

        $started = Tentative::whereIn('exercice_id', $exerciceIds)
            ->whereNotNull('user_id')
            ->where('is_correction', false)
            ->distinct('user_id')
            ->count('user_id');

        $completed = Tentative::whereIn('exercice_id', $exerciceIds)
            ->whereNotNull('user_id')
            ->where('is_correction', false)
            ->where('dictionnaireValide', true)
            ->where('dependanceValide', true)
            ->where('modeleValide', true)
            ->select('user_id')
            ->groupBy('user_id')
            ->havingRaw('COUNT(DISTINCT exercice_id) >= ?', [$totalExercices])
            ->get()
            ->count();

        return response()->json(['data' => [
            'visibility'      => $cours->visibility,
            'exercices_count' => $totalExercices,
            'started'         => $started,
            'completed'       => $completed,
        ]]);
    }

    public function destroy(Cours $cours)
    {
        $cours->delete();
        return response()->json(['message' => 'Cours supprimé'], 200);
    }
}
