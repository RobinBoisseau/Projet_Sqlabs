<?php

namespace App\Http\Controllers;

use App\Models\Classe;
use App\Models\Exercice;
use App\Models\Tentative;
use App\Http\Resources\ClasseResource;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class ClasseController extends Controller
{
    public function index(Request $request)
{
    $userId = $request->user()->id;

    $classes = Classe::where(function($query) use ($userId) {
        $query->whereHas('creator', fn($q) => $q->where('user_id', $userId))
              ->orWhereHas('teachers', fn($q) => $q->where('user_id', $userId))
              ->orWhereHas('students', fn($q) => $q->where('user_id', $userId))
              ->orWhereHas('responsables', fn($q) => $q->where('user_id', $userId));
    })->get();

    return ClasseResource::collection($classes);
}

    public function store(Request $request)
    {
        $data = $request->validate([
            'nom'         => 'required|string|max:255',
            'description' => 'nullable|string',
            'visibility'  => 'in:public,private',
            'join_code'   => 'required|string|min:4|max:8',
            'image'       => 'nullable|image|max:2048',
        ]);

        if ($request->hasFile('image')) {
            $data['image'] = $request->file('image')->store('classes', 'public');
        }

        $classe = Classe::create($data);
        $classe->creator()->attach($request->user()->id, ['role' => 'creator']);

        $allCours = \App\Models\Cours::all();
        $sync = [];
        foreach ($allCours as $index => $c) {
            $sync[$c->id] = ['order' => $index];
        }
        if (!empty($sync)) {
            $classe->cours()->sync($sync);
        }

        return new ClasseResource($classe);
    }

    public function show(int $id)
    {
        return new ClasseResource(Classe::findOrFail($id));
    }

    public function update(Request $request, int $id)
    {
        $classe = Classe::findOrFail($id);

        if (!$classe->canManageMembers($request->user())) {
            return response()->json(['message' => 'Accès refusé.'], 403);
        }

        $data = $request->validate([
            'nom'         => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'visibility'  => 'sometimes|in:public,private',
            'join_code'   => 'sometimes|string|min:4|max:8',
            'image'       => 'nullable|image|max:2048',
        ]);

        if ($request->hasFile('image')) {
            $data['image'] = $request->file('image')->store('classes', 'public');
        }

        $classe->update($data);
        return new ClasseResource($classe);
    }

    public function destroy(Request $request, int $id)
    {
        $classe = Classe::findOrFail($id);
        $user   = $request->user();

        if ($user->role !== 'admin' && !$classe->isCreator($user->id)) {
            return response()->json(['message' => 'Seul le créateur ou un administrateur peut supprimer cette classe.'], 403);
        }

        $classe->delete();
        return response()->json(['message' => 'Classe supprimée'], 200);
    }

    public function addTeacher(Request $request, int $id)
    {
        $classe = Classe::findOrFail($id);

        if (!$classe->isCreator($request->user()->id)) {
            return response()->json(['message' => 'Seul le créateur peut ajouter des enseignants.'], 403);
        }

        $data = $request->validate(['user_id' => 'required|exists:users,id']);
        $classe->teachers()->syncWithoutDetaching($data['user_id']);

        return response()->json(['message' => 'Enseignant ajouté.']);
    }

    public function removeTeacher(Request $request, int $id)
    {
        $classe = Classe::findOrFail($id);

        if (!$classe->isCreator($request->user()->id)) {
            return response()->json(['message' => 'Seul le créateur peut retirer des enseignants.'], 403);
        }

        $data = $request->validate(['user_id' => 'required|exists:users,id']);
        $classe->teachers()->detach($data['user_id']);

        return response()->json(['message' => 'Enseignant retiré.']);
    }

    public function members(Request $request, int $id)
    {
        $classe = Classe::findOrFail($id);

        if (!$classe->canManageMembers($request->user())) {
            return response()->json(['message' => 'Accès refusé.'], 403);
        }

        $members = $classe->students()->get()->merge($classe->responsables()->get())
            ->map(fn($u) => [
                'id'         => $u->id,
                'name'       => $u->name,
                'email'      => $u->email,
                'pivot_role' => $u->pivot->role,
            ])
            ->sortBy('name')
            ->values();

        return response()->json(['data' => $members]);
    }

    public function removeMembers(Request $request, int $id)
    {
        $classe = Classe::findOrFail($id);

        if (!$classe->canManageMembers($request->user())) {
            return response()->json(['message' => 'Accès refusé.'], 403);
        }

        $data = $request->validate(['user_ids' => 'required|array', 'user_ids.*' => 'exists:users,id']);

        $classe->students()->detach($data['user_ids']);
        $classe->responsables()->detach($data['user_ids']);

        return response()->json(['message' => 'Membres retirés.']);
    }

    public function promoteMembers(Request $request, int $id)
    {
        $classe = Classe::findOrFail($id);

        if (!$classe->canManageMembers($request->user())) {
            return response()->json(['message' => 'Accès refusé.'], 403);
        }

        $data = $request->validate(['user_ids' => 'required|array', 'user_ids.*' => 'exists:users,id']);

        \DB::table('classe_user')
            ->where('classe_id', $id)
            ->whereIn('user_id', $data['user_ids'])
            ->where('role', 'student')
            ->update(['role' => 'responsable']);

        return response()->json(['message' => 'Membres promus responsables.']);
    }

    public function demoteMembers(Request $request, int $id)
    {
        $classe = Classe::findOrFail($id);

        if (!$classe->canManageMembers($request->user())) {
            return response()->json(['message' => 'Accès refusé.'], 403);
        }

        $data = $request->validate(['user_ids' => 'required|array', 'user_ids.*' => 'exists:users,id']);

        \DB::table('classe_user')
            ->where('classe_id', $id)
            ->whereIn('user_id', $data['user_ids'])
            ->where('role', 'responsable')
            ->update(['role' => 'student']);

        return response()->json(['message' => 'Responsabilité retirée.']);
    }

    public function getCours(int $id): JsonResponse
    {
        $classe     = Classe::findOrFail($id);
        $cours      = $classe->cours()->with('exercices')->get();
        $studentIds = $classe->students()->pluck('users.id');

        $result = $cours->map(function ($c) use ($studentIds) {
            return [
                'id'          => $c->id,
                'nom'         => $c->nom,
                'description' => $c->description,
                'image'       => $c->image,
                'exercices'   => $c->exercices->map(function ($e) use ($studentIds) {
                    $notStarted = $studentIds->filter(function ($uid) use ($e) {
                        return Tentative::where('exercice_id', $e->id)
                            ->where('user_id', $uid)
                            ->where('is_correction', false)
                            ->doesntExist();
                    })->count();

                    $completed = $studentIds->filter(function ($uid) use ($e) {
                        return Tentative::where('exercice_id', $e->id)
                            ->where('user_id', $uid)
                            ->where('is_correction', false)
                            ->where('dictionnaireValide', true)
                            ->where('dependanceValide', true)
                            ->where('modeleValide', true)
                            ->exists();
                    })->count();

                    $inProgress = $studentIds->count() - $notStarted - $completed;

                    return [
                        'id'    => $e->id,
                        'title' => $e->titre,
                        'slug'  => $e->slug,
                        'type'  => $e->type,
                        'stats' => [
                            'not_started' => $notStarted,
                            'in_progress' => $inProgress,
                            'completed'   => $completed,
                        ],
                    ];
                }),
            ];
        });

        return response()->json(['data' => $result]);
    }

    public function updateCours(Request $request, int $id): JsonResponse
    {
        $classe = Classe::findOrFail($id);

        if (!$classe->canManageMembers($request->user())) {
            return response()->json(['message' => 'Accès refusé.'], 403);
        }

        $data = $request->validate([
            'cours'         => 'required|array',
            'cours.*.id'    => 'required|exists:cours,id',
            'cours.*.order' => 'required|integer|min:0',
        ]);

        $sync = [];
        foreach ($data['cours'] as $c) {
            $sync[$c['id']] = ['order' => $c['order']];
        }
        $classe->cours()->sync($sync);

        return response()->json(['message' => 'Cours mis à jour.']);
    }

    public function getExerciceDetail(int $id, string $slug): JsonResponse
    {
        $classe   = Classe::findOrFail($id);
        $exercice = Exercice::where('slug', $slug)->firstOrFail();

        $students = $classe->students()->get()->merge($classe->responsables()->get());

        $result = $students->map(function ($student) use ($exercice) {
            $tentatives = Tentative::where('exercice_id', $exercice->id)
                ->where('user_id', $student->id)
                ->where('is_correction', false)
                ->get();

            $attemptsCount = $tentatives->count();

            if ($attemptsCount === 0) {
                $status = 'not_started';
            } elseif ($tentatives->contains(fn($t) => $t->dictionnaireValide && $t->dependanceValide && $t->modeleValide)) {
                $status = 'completed';
            } else {
                $status = 'in_progress';
            }

            return [
                'id'             => $student->id,
                'name'           => $student->name,
                'email'          => $student->email,
                'status'         => $status,
                'attempts_count' => $attemptsCount,
            ];
        })->sortBy('name')->values();

        return response()->json([
            'data' => [
                'exercice' => [
                    'id'    => $exercice->id,
                    'titre' => $exercice->titre,
                    'slug'  => $exercice->slug,
                    'type'  => $exercice->type,
                ],
                'students' => $result,
            ],
        ]);
    }

    public function getStudentTentatives(int $id, string $slug, int $userId): JsonResponse
    {
        $exercice = Exercice::where('slug', $slug)->firstOrFail();

        $tentatives = Tentative::where('exercice_id', $exercice->id)
            ->where('user_id', $userId)
            ->where('is_correction', false)
            ->orderBy('created_at', 'asc')
            ->get()
            ->map(fn($t) => [
                'id'                 => $t->id,
                'date'               => $t->dateHeureTentative,
                'dictionary'         => $t->dictionnaire,
                'dependencies'       => $t->dependance,
                'model'              => $t->modele,
                'dictionnaireValide' => $t->dictionnaireValide,
                'dependanceValide'   => $t->dependanceValide,
                'modeleValide'       => $t->modeleValide,
            ]);

        return response()->json(['data' => $tentatives]);
    }

    public function getStudentProgress(int $id, int $userId): JsonResponse
    {
        $classe  = Classe::findOrFail($id);
        $student = $classe->students()->where('users.id', $userId)->first();

        if (!$student) {
            return response()->json(['message' => 'Étudiant non trouvé dans cette classe.'], 404);
        }

        $cours = $classe->cours()->with('exercices')->get();

        $totalExercices = 0;
        $totalCompleted = 0;
        $totalInProgress = 0;

        $coursData = $cours->map(function ($c) use ($userId, &$totalExercices, &$totalCompleted, &$totalInProgress) {
            $exercices = $c->exercices->map(function ($e) use ($userId, &$totalExercices, &$totalCompleted, &$totalInProgress) {
                $totalExercices++;

                $tentatives = Tentative::where('exercice_id', $e->id)
                    ->where('user_id', $userId)
                    ->where('is_correction', false)
                    ->count();

                $completed = Tentative::where('exercice_id', $e->id)
                    ->where('user_id', $userId)
                    ->where('is_correction', false)
                    ->where('dictionnaireValide', true)
                    ->where('dependanceValide', true)
                    ->where('modeleValide', true)
                    ->exists();

                if ($completed) {
                    $totalCompleted++;
                    $status = 'completed';
                } elseif ($tentatives > 0) {
                    $totalInProgress++;
                    $status = 'in_progress';
                } else {
                    $status = 'not_started';
                }

                return [
                    'slug'           => $e->slug,
                    'title'          => $e->titre,
                    'type'           => $e->type,
                    'status'         => $status,
                    'attempts_count' => $tentatives,
                ];
            });

            return [
                'id'        => $c->id,
                'nom'       => $c->nom,
                'exercices' => $exercices,
            ];
        });

        return response()->json([
            'student' => [
                'id'    => $student->id,
                'name'  => $student->name,
                'email' => $student->email,
            ],
            'stats' => [
                'total'       => $totalExercices,
                'completed'   => $totalCompleted,
                'in_progress' => $totalInProgress,
                'not_started' => $totalExercices - $totalCompleted - $totalInProgress,
            ],
            'cours' => $coursData,
        ]);
    }

    public function join(Request $request)
    {
        $data = $request->validate(['join_code' => 'required|string']);

        $classe = Classe::where('join_code', $data['join_code'])->first();

        if (!$classe) {
            return response()->json(['message' => 'Code incorrect.'], 422);
        }

        $classe->students()->syncWithoutDetaching($request->user()->id);

        return new ClasseResource($classe);
    }
}
