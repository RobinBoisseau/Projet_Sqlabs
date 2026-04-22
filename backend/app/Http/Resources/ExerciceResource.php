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
   public function toArray(Request $request)
{
    return [
        'enonce' => $this->enonce,
        'titre' => $this->titre,
        'type' => $this->type
    ];
}
}
