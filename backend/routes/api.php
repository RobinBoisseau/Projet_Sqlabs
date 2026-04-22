<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\ExerciceController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\ClasseController;
use App\Http\Controllers\TentativeController;
use App\Http\Controllers\FichierController;


Route::apiResource('exercices', ExerciceController::class);
Route::apiResource('users', UserController::class);
Route::apiResource('classe', ClasseController::class);
Route::apiResource('tentatives', TentativeController::class);
Route::apiResource('fichiers', FichierController::class);
