<?php
namespace App\Http\Controllers;
use App\Models\Tentative;
use App\Http\Resources\TentativeResource;
use Illuminate\Http\Request;

class TentativeController extends Controller
{
    public function index() {
        return TentativeResource::collection(Tentative::all());
    }

    public function store(Request $request) {
        $tentative = Tentative::updateOrCreate(
            [
                'exercice_id' => $request->exercice_id,
                'user_id' => auth()->id()
            ],
            [
                'dictionnaire' => $request->dictionary,
                'dependance'   => $request->dependencies,
                'modele'       => $request->model,
                'dateHeureTentative' => now()
            ]
        );
        return new TentativeResource($tentative);
    }

    public function show($id) {
        $tentative = Tentative::findOrFail($id);
        return new TentativeResource($tentative);
    }

    public function update(Request $request, $id) {
        $tentative = Tentative::findOrFail($id);
        $tentative->update([
            'dictionnaire' => $request->dictionary,
            'dependance'   => $request->dependencies,
            'modele'       => $request->model,
            'dateHeureTentative' => now()
        ]);
        return new TentativeResource($tentative);
    }

    public function destroy($id) {
        Tentative::destroy($id);
        return response()->json(['message' => 'Deleted successfully']);
    }

    public function getByExercice($exercice_id) {
        $tentative = Tentative::where('exercice_id', $exercice_id)
            ->where('user_id', auth()->id())
            ->latest()
            ->first();

        if (!$tentative) {
            return response()->json(['data' => null], 200);
        }

        return new TentativeResource($tentative);
    }
}