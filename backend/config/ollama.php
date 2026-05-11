<?php

return [
    'url'   => env('OLLAMA_URL', 'http://ollama:11434'),
    'model' => env('OLLAMA_MODEL', 'mistral:7b-instruct-q4_0'),
];
