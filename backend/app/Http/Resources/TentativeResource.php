<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TentativeResource extends JsonResource 
{
    public function toArray(Request $request): array 
    {
        // On s'assure de ne pas appeler de fonctions sur des objets nuls
        return [
            'id'            => $this->id,
            'exercise_id'   => $this->exercice_id,
            'is_correction' => $this->is_correction,
            'dictionary'    => $this->dictionnaire ?? [],
            'dependencies'  => $this->dependance ?? [],
            'model'         => $this->modele ?? (object)[],
            'date'          => $this->dateHeureTentative?->format('Y-m-d H:i:s'),
        ];
    }
}