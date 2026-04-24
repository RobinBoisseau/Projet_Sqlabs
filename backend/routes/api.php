<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\ExerciceController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\ClasseController;
use App\Http\Controllers\TentativeController;
use App\Http\Controllers\FichierController;
use App\Http\Controllers\ReponseIAController;

// On met /s/ pour ne pas confondre avec l'ID
Route::get('/exercices/s/{slug}', [ExerciceController::class, 'showBySlug']);

Route::get('exercices/{slug}', [ExerciceController::class, 'show']);
Route::apiResource('exercices', ExerciceController::class)->except(['show']);
Route::apiResource('reponse-ia', ReponseIAController::class);
Route::apiResource('users', UserController::class);
Route::apiResource('classe', ClasseController::class);
Route::apiResource('tentatives', TentativeController::class);
Route::apiResource('fichiers', FichierController::class);

