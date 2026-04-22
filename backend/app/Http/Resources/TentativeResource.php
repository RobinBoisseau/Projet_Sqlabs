<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TentativeResource extends JsonResource {
    public function toArray(Request $request): array {
        return [
            'dictionnaire' => $this->dictionnaire,
            'dependance' => $this->dependance,
            'modele' => $this->modele,
            'validations' => [
                'dictionnaire' => $this->dictionnaireValide,
                'dependance' => $this->dependanceValide,
                'modele' => $this->modeleValide,
            ],
            'corrections' => [
                'dictionnaire' => $this->dictionnaireCorrige,
                'dependance' => $this->dependanceCorrige,
                'modele' => $this->modeleCorrige,
            ],
            'date' => $this->dateHeureTentative ? $this->dateHeureTentative->format('Y-m-d H:i:s') : null
        ];
    }
}