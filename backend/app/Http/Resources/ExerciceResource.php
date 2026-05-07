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
        $tentatives = $this->tentatives()->where('user_id', 1);

        $estTermine = (clone $tentatives)
            ->where('dictionnaireValide', true)
            ->where('dependanceValide', true)
            ->where('modeleValide', true)
            ->exists();

        $estEnCours = false;
        if (!$estTermine) {
            $estEnCours = (clone $tentatives)
                ->where(function($query) {
                    $query->where('dictionnaireValide', true)
                        ->orWhere('dependanceValide', true)
                        ->orWhere('modeleValide', true);
                })
                ->exists();
        }

        $statut = 'A faire';
        if ($estTermine) $statut = 'Terminé';
        elseif ($estEnCours) $statut = 'En cours';

        return [
            'id' => $this->id,
            'title' => $this->titre,
            'slug' => $this->slug,
            'type' => $this->type,
            'status' => $statut,
            'statement' => $this->enonce,
        ];
    }

}