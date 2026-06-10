<?php
namespace App\Http\Controllers;

use App\Models\Tentative;
use App\Http\Resources\TentativeResource;
use App\Services\AnalyseIAService;
use App\Services\OllamaService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class TentativeController extends Controller
{
    public function index() {
        return TentativeResource::collection(Tentative::all());
    }

    public function store(Request $request, AnalyseIAService $analyseService, OllamaService $ollama): JsonResponse
    {
        $hashes = $this->computeHashes($request);          // Calcule les hash DD, DF, MCD de la tentative entrante
        $last   = $this->getLastTentative($request->exercice_id); // Récupère la dernière tentative de l'étudiant en BD

        // Tentative identique à la dernière → on renvoie les réponses en cache sans rien stocker
        if ($this->isSameTentative($last, $hashes)) {
            $cached = $analyseService->getAllLastResponses($last);
            // Si au moins une réponse IA existe en cache, on la renvoie
            if ($cached['mcd'] !== null || $cached['dictionary'] !== null || $cached['dependencies'] !== null) {
                return $this->returnLastResponses($last, $analyseService, $request);
            }
            // Aucune réponse IA en cache (l'IA avait échoué) → on relance l'analyse sur la tentative existante
            $iaResults = $analyseService->analyseAll(
                $last,
                null,
                $request->model        ?? [],
                $request->dictionary   ?? [],
                $request->dependencies ?? [],
                $hashes,
                $ollama
            );
            return response()->json([
                'data' => (new TentativeResource($last))->toArray($request),
                'ia'   => $iaResults,
            ]);
        }

        // Nouvelle tentative → on la stocke
        $tentative = $this->storeTentative($request, $hashes);

        // Analyse chaque composant (cache ou appel IA)
        $iaResults = $analyseService->analyseAll(
            $tentative,
            $last,
            $request->model        ?? [],
            $request->dictionary   ?? [],
            $request->dependencies ?? [],
            $hashes,
            $ollama
        );

        return response()->json([
            'data' => (new TentativeResource($tentative))->toArray($request),
            'ia'   => $iaResults,
        ]);
    }

    // ── Helpers store() ──────────────────────────────────────────────────────

    private function computeHashes(Request $request): array
    {
        return [
            'mcd'  => $this->hashData($request->model),
            'dico' => $this->hashData($request->dictionary),
            'dep'  => $this->hashData($request->dependencies),
        ];
    }

    private function getLastTentative(int $exerciceId): ?Tentative
    {
        return Tentative::where('exercice_id', $exerciceId)
            ->where('user_id', auth()->id())
            ->where('is_correction', false)
            ->latest('id')
            ->first();
    }

    private function isSameTentative(?Tentative $last, array $hashes): bool
    {
        if (!$last) return false;

        return $last->hash_mcd  === $hashes['mcd']
            && $last->hash_dico === $hashes['dico']
            && $last->hash_dep  === $hashes['dep'];
    }

    private function returnLastResponses(Tentative $last, AnalyseIAService $analyseService, Request $request): JsonResponse
    {
        $cached = $analyseService->getAllLastResponses($last);

        $last->update([
            'dictionnaireValide' => $analyseService->isFullyValid($cached['dictionary']),
            'dependanceValide'   => $analyseService->isFullyValid($cached['dependencies']),
            'modeleValide'       => $analyseService->isFullyValid($cached['mcd']),
        ]);

        return response()->json([
            'data' => (new TentativeResource($last))->toArray($request),
            'ia'   => $cached,
        ]);
    }

    private function storeTentative(Request $request, array $hashes): Tentative
    {
        return Tentative::create([
            'exercice_id'        => $request->exercice_id,
            'user_id'            => auth()->id(),
            'dictionnaire'       => $request->dictionary,
            'dependance'         => $request->dependencies,
            'modele'             => $request->model,
            'hash_mcd'           => $hashes['mcd'],
            'hash_dico'          => $hashes['dico'],
            'hash_dep'           => $hashes['dep'],
            'dateHeureTentative' => now(),
        ]);
    }

    // ── Autres routes ────────────────────────────────────────────────────────

    public function show($id) {
        return new TentativeResource(Tentative::with('user')->findOrFail($id));
    }

    public function update(Request $request, $id) {
        $tentative = Tentative::findOrFail($id);
        $tentative->update([
            'dictionnaire'       => $request->dictionary,
            'dependance'         => $request->dependencies,
            'modele'             => $request->model,
            'hash_mcd'           => $this->hashData($request->model),
            'hash_dico'          => $this->hashData($request->dictionary),
            'hash_dep'           => $this->hashData($request->dependencies),
            'dateHeureTentative' => now(),
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
            ->latest('id')
            ->first();

        return $tentative
            ? new TentativeResource($tentative)
            : response()->json(['data' => null], 200);
    }

    public function getAllByExercice(string $slug): JsonResponse
    {
        $exercice  = \App\Models\Exercice::where('slug', $slug)->firstOrFail();
        $tentatives = Tentative::with('user')
            ->where('exercice_id', $exercice->id)
            ->where('is_correction', false)
            ->orderByDesc('dateHeureTentative')
            ->get();

        return response()->json([
            'exercice' => ['id' => $exercice->id, 'title' => $exercice->titre, 'slug' => $exercice->slug],
            'data'     => TentativeResource::collection($tentatives),
        ]);
    }

    public function toggleTestable(int $id): JsonResponse
    {
        $tentative = Tentative::findOrFail($id);
        $tentative->est_testable = !$tentative->est_testable;
        $tentative->save();
        return response()->json(['est_testable' => $tentative->est_testable]);
    }

    public function getTestableByExercice(string $slug): JsonResponse
    {
        $exercice  = \App\Models\Exercice::where('slug', $slug)->firstOrFail();
        $tentatives = Tentative::with('user')
            ->where('exercice_id', $exercice->id)
            ->where('est_testable', true)
            ->where('is_correction', false)
            ->orderByDesc('dateHeureTentative')
            ->get();

        return response()->json([
            'exercice'   => ['id' => $exercice->id, 'title' => $exercice->titre, 'slug' => $exercice->slug],
            'data'       => TentativeResource::collection($tentatives),
        ]);
    }

    // ── Hash ─────────────────────────────────────────────────────────────────

    private function hashData(mixed $data): string {
        return hash('sha256', json_encode($this->normalizeForHash($data), JSON_UNESCAPED_UNICODE));
    }

    private function normalizeForHash(mixed $data): mixed {
        if (!is_array($data)) return $data;
        if (array_is_list($data)) return array_map(fn($item) => $this->normalizeForHash($item), $data);
        ksort($data);
        return array_map(fn($item) => $this->normalizeForHash($item), $data);
    }
}
