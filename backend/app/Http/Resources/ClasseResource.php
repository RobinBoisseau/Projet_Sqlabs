<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ClasseResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $userId = $request->user()?->id;
        $isStaff = $userId && $this->isStaff($userId);

        return [
            'id'           => $this->id,
            'nom'          => $this->nom,
            'description'  => $this->description,
            'image'        => $this->image ? asset('storage/' . $this->image) : null,
            'visibility'   => $this->visibility,
            'member_count' => $this->creator()->count()
                            + $this->teachers()->count()
                            + $this->students()->count(),
            'join_code'    => $isStaff ? $this->join_code : null,
            'can_edit'     => $userId && $this->canManageMembers($request->user()),
            'created_at'   => $this->created_at->format('d/m/Y'),
        ];
    }
}
