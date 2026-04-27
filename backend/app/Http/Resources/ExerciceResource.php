<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ExerciceResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
   public function toArray(Request $request): array{
        // Laravel va regarder dans la table 'concerner' pour trouver les tentatives liées
        // puis vérifier les 3 conditions dans la table 'tentatives'
        $estFini = $this->tentatives()
            ->where('dictionnaireValide', true)
            ->where('dependanceValide', true)
            ->where('modeleValide', true)
            ->exists();

        return [
            'id' => $this->id,
            'titre' => $this->titre,
            'slug' => $this->slug,
            'type' => $this->type,
            'est_termine' => $estFini, // Renvoie true ou false
        ];
    }

}