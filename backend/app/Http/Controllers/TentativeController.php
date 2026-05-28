<?php
namespace App\Http\Controllers;
use App\Models\Tentative;
use App\Models\ReponseIA;
use App\Http\Resources\TentativeResource;
use Illuminate\Http\Request;

class TentativeController extends Controller
{
    public function index() {
        return TentativeResource::collection(Tentative::all());
    }

    public function store(Request $request) {
    $hashDico = $this->hashData($request->dictionary);
    $hashDep  = $this->hashData($request->dependencies);
    $hashMcd  = $this->hashData($request->model);

    // Récupérer la tentative existante pour comparer les hashes
    $existing = Tentative::where('exercice_id', $request->exercice_id)
        ->where('user_id', auth()->id())
        ->where('is_correction', false)
        ->first();

    $changed = [
        'dictionary'   => $hashDico !== $existing?->hash_dico,
        'dependencies' => $hashDep  !== $existing?->hash_dep,
        'model'        => $hashMcd  !== $existing?->hash_mcd,
    ];

    $tentative = Tentative::updateOrCreate(
        [
            'exercice_id'   => $request->exercice_id,
            'user_id'       => auth()->id(),
            'is_correction' => false
        ],
        [
            'dictionnaire'       => $request->dictionary,
            'dependance'         => $request->dependencies,
            'modele'             => $request->model,
            'hash_dico'          => $hashDico,
            'hash_dep'           => $hashDep,
            'hash_mcd'           => $hashMcd,
            'dateHeureTentative' => now()
        ]
    );

    // Récupérer les réponses IA en cache pour les parties inchangées
    $cached = [];
    $elementMap = ['model' => 'mcd', 'dictionary' => 'dico', 'dependencies' => 'dep'];
    foreach ($elementMap as $key => $element) {
        if (!$changed[$key]) {
            $reponse = ReponseIA::where('tentative_id', $tentative->id)
                ->where('element', $element)
                ->latest()
                ->first();
            if ($reponse) {
                $cached[$key] = $reponse->reponseJson;
            }
        }
    }

    return (new TentativeResource($tentative))->additional([
        'changed' => $changed,
        'cached'  => $cached,
    ]);
}

    private function hashData(mixed $data): string {
        return hash('sha256', json_encode($this->normalizeForHash($data), JSON_UNESCAPED_UNICODE));
    }

    private function normalizeForHash(mixed $data): mixed {
        if (!is_array($data)) return $data;
        if (array_is_list($data)) return array_map(fn($item) => $this->normalizeForHash($item), $data);
        ksort($data);
        return array_map(fn($item) => $this->normalizeForHash($item), $data);
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
            'hash_dico'    => $this->hashData($request->dictionary),
            'hash_dep'     => $this->hashData($request->dependencies),
            'hash_mcd'     => $this->hashData($request->model),
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
            ->where('is_correction', false)
            ->latest()
            ->first();

        if (!$tentative) {
            return response()->json(['data' => null], 200);
        }

        return new TentativeResource($tentative);
    }
}