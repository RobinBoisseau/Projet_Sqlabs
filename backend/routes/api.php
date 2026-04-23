<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\ExerciceController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\ClasseController;
use App\Http\Controllers\TentativeController;
use App\Http\Controllers\FichierController;
use App\Http\Controllers\ReponseIAController;


Route::get('exercices/{slug}', [ExerciceController::class, 'show']);
Route::apiResource('exercices', ExerciceController::class)->except(['show']);
Route::apiResource('reponse-ia', ReponseIAController::class);
Route::apiResource('users', UserController::class);
Route::apiResource('classe', ClasseController::class);
Route::apiResource('tentatives', TentativeController::class);
<<<<<<< HEAD
Route::apiResource('fichiers', FichierController::class);
=======
Route::apiResource('fichiers', FichierController::class);
// On met /s/ pour ne pas confondre avec l'ID
Route::get('/exercises/s/{slug}', [ExerciceController::class, 'showBySlug']);
>>>>>>> 4c1ce90b0119953c92c83bf3bf93f8cefa80c216
