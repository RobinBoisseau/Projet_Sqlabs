<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CoursResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'          => $this->id,
            'nom'         => $this->nom,
            'description' => $this->description,
            'image'       => $this->image,
            'visibility'  => $this->visibility,
            'exercices'   => $this->whenLoaded('exercices', function () {
                return $this->exercices->map(fn ($ex) => [
                    'id'    => $ex->id,
                    'title' => $ex->titre,
                    'slug'  => $ex->slug,
                    'type'  => $ex->type,
                    'order' => $ex->pivot->order,
                ]);
            }),
            'exercices_count' => $this->whenCounted('exercices'),
            'created_at'  => $this->created_at,
            'updated_at'  => $this->updated_at,
        ];
    }
}
