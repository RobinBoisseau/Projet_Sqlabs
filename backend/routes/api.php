<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\ExerciceController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\ClasseController;
use App\Http\Controllers\TentativeController;
use App\Http\Controllers\FichierController;
use App\Http\Controllers\CoursController;

// Routes publiques (anti brute-force : 10 requêtes/minute)
Route::middleware('throttle:10,1')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login',    [AuthController::class, 'login']);
});

// Token de dev local uniquement
if (app()->environment('local')) {
    Route::get('/dev-token', function () {
        $user = \App\Models\User::where('email', 'admin@sqlabs.fr')->first();
        return response()->json(['token' => $user->createToken('dev')->plainTextToken]);
    });
}

// Routes protégées (60 requêtes/minute)
Route::middleware(['auth:sanctum', 'throttle:60,1'])->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me',      [AuthController::class, 'me']);
    Route::put('/profile', [ProfileController::class, 'update']);

    // On met /s/ pour ne pas confondre avec l'ID
    Route::get('/exercices/s/{slug}', [ExerciceController::class, 'showBySlug']);
    Route::get('exercices/{slug}', [ExerciceController::class, 'show']);
    Route::apiResource('exercices', ExerciceController::class)->except(['show']);

    Route::get('/tentatives/exercice/{exercice_id}', [TentativeController::class, 'getByExercice']);
    Route::get('/exercices/{slug}/all-tentatives', [TentativeController::class, 'getAllByExercice']);
    Route::patch('/tentatives/{id}/testable', [TentativeController::class, 'toggleTestable']);
    Route::apiResource('tentatives', TentativeController::class);

    Route::post('classe/join', [ClasseController::class, 'join']);
    Route::post('classe/{id}/teachers', [ClasseController::class, 'addTeacher']);
    Route::delete('classe/{id}/teachers', [ClasseController::class, 'removeTeacher']);
    Route::get('classe/{id}/members', [ClasseController::class, 'members']);
    Route::delete('classe/{id}/members', [ClasseController::class, 'removeMembers']);
    Route::post('classe/{id}/members/promote', [ClasseController::class, 'promoteMembers']);
    Route::post('classe/{id}/members/demote', [ClasseController::class, 'demoteMembers']);
    Route::get('classe/{id}/cours', [ClasseController::class, 'getCours']);
    Route::put('classe/{id}/cours', [ClasseController::class, 'updateCours']);
    Route::get('classe/{id}/exercice/{slug}', [ClasseController::class, 'getExerciceDetail']);
    Route::apiResource('classe', ClasseController::class);

    // Cours : lecture pour tous, écriture réservée aux admins
    Route::get('cours', [CoursController::class, 'index']);
    Route::get('cours/{cours}', [CoursController::class, 'show']);
    Route::get('cours/{cours}/stats', [CoursController::class, 'stats']);

    Route::middleware('admin')->group(function () {
        Route::get('/exercices/{slug}/tentatives-testables', [TentativeController::class, 'getTestableByExercice']);
        Route::get('/exercices/{slug}/correction', [ExerciceController::class, 'getCorrection']);
        Route::put('/exercices/{slug}/correction', [ExerciceController::class, 'updateWithCorrection']);
        Route::apiResource('users', UserController::class);

        Route::post('cours', [CoursController::class, 'store']);
        Route::put('cours/{cours}', [CoursController::class, 'update']);
        Route::put('cours/{cours}/exercices', [CoursController::class, 'updateExercices']);
        Route::delete('cours/{cours}', [CoursController::class, 'destroy']);
    });
    Route::apiResource('fichiers', FichierController::class);
});

