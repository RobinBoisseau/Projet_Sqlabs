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
        $tentatives = $this->tentatives()
            ->where('user_id', auth()->id())
            ->where('is_correction', false);

        // Terminé : au moins une tentative où les 3 composants sont validés par l'IA
        $estTermine = (clone $tentatives)
            ->where('dictionnaireValide', true)
            ->where('dependanceValide', true)
            ->where('modeleValide', true)
            ->exists();

        // En cours : au moins une tentative soumise (peu importe le résultat IA)
        $estEnCours = !$estTermine && (clone $tentatives)->exists();

        $status = 'to_do';
        if ($estTermine) $status = 'completed';
        elseif ($estEnCours) $status = 'in_progress';

        return [
            'id' => $this->id,
            'title' => $this->titre,
            'slug' => $this->slug,
            'type' => $this->type,
            'status' => $status,
            'statement' => $this->enonce,
            'etat'       => $this->etat,
            'visibility' => (bool) $this->visibility,
        ];
    }

}
