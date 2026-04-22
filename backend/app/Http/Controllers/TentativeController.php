<?php

namespace App\Http\Controllers;

use App\Models\Tentative;
use App\Http\Resources\TentativeResource;
use Illuminate\Http\Request;

class TentativeController extends Controller {
    public function index() {
        return TentativeResource::collection(Tentative::all());
    }

    public function store(Request $request) {
        $tentative = Tentative::create($request->all());
        return new TentativeResource($tentative);
    }

    public function show($id) {
        $tentative = Tentative::findOrFail($id);
        return new TentativeResource($tentative);
    }

    public function update(Request $request, $id) {
        $tentative = Tentative::findOrFail($id);
        $tentative->update($request->all());
        return new TentativeResource($tentative);
    }

    public function destroy($id) {
        Tentative::destroy($id);
        return response()->json(['message' => 'Supprimé avec succès']);
    }
}