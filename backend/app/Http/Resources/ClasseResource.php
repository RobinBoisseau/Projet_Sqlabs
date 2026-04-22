<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ClasseResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'nom' => $this->nom,
            'mdp' => $this->mdp, // Attention: en production on ne renvoie jamais de mdp !
            'created_at' => $this->created_at->format('d/m/Y'),
        ];
    }
}