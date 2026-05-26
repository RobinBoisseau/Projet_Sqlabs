<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Exercice;
use App\Models\User;

class PlaylistMusicaleSeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::where('email', 'admin@sqlabs.fr')->first();

        Exercice::firstOrCreate(
            ['slug' => 'playlist-musical'],
            [
                'titre'   => 'playlistMusical',
                'slug'    => 'playlist-musical',
                'enonce'  => "Un développeur veut créer un site web pour gérer des playlists musicales. Il vous demande de concevoir la base de données.\n\nLa page d'accueil liste l'ensemble des playlists dans un tableau qui affiche le nom de la playlist, son style, le nombre de chansons qui la compose ainsi que sa durée totale.\n\nUn clic sur une playlist permet d'afficher une page qui contient les infos sur la playlist (nom, style, nombre de chansons), ainsi qu'un tableau qui liste les chansons qui composent la playlist. Le tableau contient les colonnes suivantes : nom de la chanson, l'interprète, la durée et l'ordre dans la playlist (1, 2, 3...).\n\nUne même chanson peut être dans plusieurs playlist. Une playlist contient au moins une chanson. Il n'y a pas de limite au nombre de chansons qu'une playlist peut contenir.",
                'type'    => 'SQL',
                'etat'    => 'Non fini',
                'user_id' => $admin->id,
            ]
        );
    }
}
