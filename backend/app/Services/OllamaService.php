<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;

class OllamaService
{
    private string $url;
    private string $model;

    public function __construct()
    {
        $this->url   = config('ollama.url');
        $this->model = config('ollama.model');
    }

    public function generate(string $prompt): string
    {
        $response = Http::timeout(120)->post("{$this->url}/api/generate", [
            'model'  => $this->model,
            'prompt' => $prompt,
            'stream' => false,
        ]);

        return $response->json('response') ?? '';
    }

    public function chat(array $messages): string
    {
        $response = Http::timeout(120)->post("{$this->url}/api/chat", [
            'model'    => $this->model,
            'messages' => $messages,
            'stream'   => false,
        ]);

        return $response->json('message.content') ?? '';
    }
}
