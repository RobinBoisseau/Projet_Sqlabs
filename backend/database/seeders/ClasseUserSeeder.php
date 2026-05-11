<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Classe;

class ClasseUserSeeder extends Seeder
{
    public function run(): void
    {
        $teachers = User::where('role', 'professeur')->get();
        $students = User::where('role', 'etudiant')->get();
        $classes  = Classe::all();

        if ($classes->isEmpty()) {
            $this->command->warn('Aucune classe trouvée.');
            return;
        }

        // Assigner un professeur par classe
        foreach ($classes as $index => $classe) {
            if ($teachers->isNotEmpty()) {
                $teacher = $teachers[$index % $teachers->count()];
                $classe->teachers()->syncWithoutDetaching([$teacher->id]);
            }
        }

        // Inscrire chaque étudiant dans 1 ou 2 classes
        foreach ($students as $student) {
            $assigned = $classes->random(rand(1, min(2, $classes->count())));
            foreach ($assigned as $classe) {
                $classe->students()->syncWithoutDetaching([$student->id]);
            }
        }

        $this->command->info('Association classe_user remplie avec succès.');
    }
}
