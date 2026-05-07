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
            'id' => $this->id,
            'exercise_id' => $this->exercice_id,
            // Mapping English (Angular) -> French (Base de données)
            'dictionary'  => $this->dictionnaire ?? [],
            'dependencies' => $this->dependance ?? [],
            'model'       => $this->modele ?? (object)[],
            // On renvoie un statut fixe pour tester
            'status'      => 'In Progress', 
            'date'        => $this->dateHeureTentative ? $this->dateHeureTentative->format('Y-m-d H:i:s') : null
        ];
    }
}