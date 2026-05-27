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

        $tentative = Tentative::create([
            'exercice_id'        => $request->exercice_id,
            'user_id'            => auth()->id(),
            'dictionnaire'       => $request->dictionary,
            'dependance'         => $request->dependencies,
            'modele'             => $request->model,
            'hash_dico'          => $hashDico,
            'hash_dep'           => $hashDep,
            'hash_mcd'           => $hashMcd,
            'dateHeureTentative' => now()
        ]);

        // Chercher dans toutes les tentatives précédentes si un hash identique existe
        $precedentes = Tentative::where('exercice_id', $request->exercice_id)
            ->where('user_id', auth()->id())
            ->where('is_correction', false)
            ->where('id', '!=', $tentative->id)
            ->get();

        $hashMap = [
            'model'        => ['hash' => $hashMcd,  'col' => 'hash_mcd',  'element' => 'mcd'],
            'dictionary'   => ['hash' => $hashDico, 'col' => 'hash_dico', 'element' => 'dico'],
            'dependencies' => ['hash' => $hashDep,  'col' => 'hash_dep',  'element' => 'dep'],
        ];

        $changed = [];
        $cached  = [];

        foreach ($hashMap as $key => $info) {
            $reponse = null;

            foreach ($precedentes->where($info['col'], $info['hash'])->sortByDesc('id') as $t) {
                $reponse = ReponseIA::where('tentative_id', $t->id)
                    ->where('element', $info['element'])
                    ->latest()
                    ->first();
                if ($reponse) break;
            }

            if ($reponse) {
                $changed[$key] = false;
                $cached[$key]  = $reponse->reponseJson;
            } else {
                $changed[$key] = true;
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