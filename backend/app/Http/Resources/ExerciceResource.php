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
        // 1. On récupère les tentatives liées
        $tentatives = $this->tentatives();

        // 2. Condition "Terminé" : Au moins une tentative avec les 3 à TRUE
        $estTermine = (clone $tentatives)
            ->where('dictionnaireValide', true)
            ->where('dependanceValide', true)
            ->where('modeleValide', true)
            ->exists();

        // 3. Condition "En cours" : Au moins une tentative avec AU MOINS UN des trois à TRUE
        // (Mais seulement si l'exercice n'est pas déjà considéré comme "Terminé")
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

        // 4. On détermine le statut final sous forme de texte pour simplifier le travail d'Angular
        $statut = 'A faire';
        if ($estTermine) $statut = 'Terminé';
        elseif ($estEnCours) $statut = 'En cours';

        return [
            'id' => $this->id,
            'titre' => $this->titre,
            'slug' => $this->slug,
            'type' => $this->type,
            'statut' => $statut,
            'enonce' => $this->enonce,
        ];
    }

}