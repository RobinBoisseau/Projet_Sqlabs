<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Exercice;
use App\Models\Tentative;
use App\Models\User;

class PlaylistMusicaleSeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::where('email', 'admin@sqlabs.fr')->first();

        $exercice = Exercice::firstOrCreate(
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

        Tentative::firstOrCreate(
            ['exercice_id' => $exercice->id, 'is_correction' => true],
            [
                'is_correction'      => true,
                'user_id'            => null,
                'dateHeureTentative' => now(),
                'dictionnaire' => [
                    ['id' => '17798049184781', 'Type' => 'INT',      'name' => 'id',        'PrimaryKey' => false, 'TechnicalName' => 'id_playlist'],
                    ['id' => '17798049184782', 'Type' => 'INT',      'name' => 'id',        'PrimaryKey' => false, 'TechnicalName' => 'id_chanson'],
                    ['id' => '17798049184783', 'Type' => 'VARCHAR2', 'name' => 'nom',       'PrimaryKey' => false, 'TechnicalName' => 'nom_playlist'],
                    ['id' => '17798049184784', 'Type' => 'VARCHAR2', 'name' => 'nom',       'PrimaryKey' => false, 'TechnicalName' => 'nom_chanson'],
                    ['id' => '17798049184785', 'Type' => 'VARCHAR2', 'name' => 'interprete','PrimaryKey' => false, 'TechnicalName' => 'interprete_chanson'],
                    ['id' => '1779805247552',  'Type' => 'INT',      'name' => 'duree',     'PrimaryKey' => false, 'TechnicalName' => 'duree_chanson'],
                    ['id' => '1779805293154',  'Type' => 'INT',      'name' => 'ordre',     'PrimaryKey' => false, 'TechnicalName' => 'ordre_playlist'],
                    ['id' => '1779805407816',  'Type' => 'VARCHAR2', 'name' => 'style',     'PrimaryKey' => false, 'TechnicalName' => 'style_playlist'],
                ],
                'dependance' => [
                    ['id' => '17798049184531', 'source' => ['id_playlist', 'id_chanson'], 'cible' => ['ordre_playlist']],
                    ['id' => '17798049184532', 'source' => ['id_playlist'],               'cible' => ['nom_playlist', 'style_playlist']],
                    ['id' => '17798049184533', 'source' => ['id_chanson'],                'cible' => ['nom_chanson', 'interprete_chanson', 'duree_chanson']],
                ],
                'modele' => [
                    'Entities' => [
                        [
                            'id' => 'ent_mpmpxbhv_5jzpg', 'name' => 'Playlist',
                            'posX' => 630, 'posY' => 110, 'width' => 160, 'height' => 111,
                            'fields' => [
                                ['id' => '17798049184781', 'Type' => 'INT',      'name' => 'id',    'PrimaryKey' => false, 'TechnicalName' => 'id_playlist'],
                                ['id' => '17798049184783', 'Type' => 'VARCHAR2', 'name' => 'nom',   'PrimaryKey' => false, 'TechnicalName' => 'nom_playlist'],
                                ['id' => '1779805407816',  'Type' => 'VARCHAR2', 'name' => 'style', 'PrimaryKey' => false, 'TechnicalName' => 'style_playlist'],
                            ],
                        ],
                        [
                            'id' => 'ent_mpmpyxv6_2mud3', 'name' => 'Chanson',
                            'posX' => 470, 'posY' => 450, 'width' => 160, 'height' => 133,
                            'fields' => [
                                ['id' => '17798049184782', 'Type' => 'INT',      'name' => 'id',        'PrimaryKey' => false, 'TechnicalName' => 'id_chanson'],
                                ['id' => '17798049184784', 'Type' => 'VARCHAR2', 'name' => 'nom',       'PrimaryKey' => false, 'TechnicalName' => 'nom_chanson'],
                                ['id' => '17798049184785', 'Type' => 'VARCHAR2', 'name' => 'interprete','PrimaryKey' => false, 'TechnicalName' => 'interprete_chanson'],
                                ['id' => '1779805247552',  'Type' => 'INT',      'name' => 'duree',     'PrimaryKey' => false, 'TechnicalName' => 'duree_chanson'],
                            ],
                        ],
                    ],
                    'Associations' => [
                        [
                            'id' => 'asc_mpmqavig_w4x9s', 'name' => 'Composer',
                            'posX' => 190, 'posY' => 220, 'width' => 138, 'height' => 80,
                            'fields' => [
                                ['id' => '1779805293154', 'Type' => 'INT', 'name' => 'ordre', 'PrimaryKey' => false, 'TechnicalName' => 'ordre_playlist'],
                            ],
                        ],
                    ],
                    'Links' => [
                        ['id' => 'lnk_soacppq3', 'assocId' => 'asc_mpmqavig_w4x9s', 'entityId' => 'ent_mpmpyxv6_2mud3', 'cardinality' => '0,N'],
                        ['id' => 'lnk_ujsmqm8a', 'assocId' => 'asc_mpmqavig_w4x9s', 'entityId' => 'ent_mpmpxbhv_5jzpg', 'cardinality' => '1,N'],
                    ],
                ],
            ]
        );
    }
}
