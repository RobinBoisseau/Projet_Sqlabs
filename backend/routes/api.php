<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\ExerciceController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\ClasseController;
use App\Http\Controllers\TentativeController;
use App\Http\Controllers\FichierController;
use App\Http\Controllers\ReponseIAController;

// Routes publiques
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login',    [AuthController::class, 'login']);

// Routes protégées
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me',      [AuthController::class, 'me']);

    // On met /s/ pour ne pas confondre avec l'ID
    Route::get('/exercices/s/{slug}', [ExerciceController::class, 'showBySlug']);
    Route::get('exercices/{slug}', [ExerciceController::class, 'show']);
    Route::apiResource('exercices', ExerciceController::class)->except(['show']);

    Route::get('/tentatives/exercice/{exercice_id}', [TentativeController::class, 'getByExercice']);
    Route::apiResource('tentatives', TentativeController::class);

    Route::apiResource('reponse-ia', ReponseIAController::class);
    Route::apiResource('users', UserController::class);
    Route::apiResource('classe', ClasseController::class);
    Route::apiResource('fichiers', FichierController::class);
});

