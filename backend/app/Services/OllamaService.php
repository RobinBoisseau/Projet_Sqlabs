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

    public function generate(string $prompt, int $maxTokens = 300): string
    {
        $response = Http::withOptions([
            'curl' => [
                CURLOPT_TIMEOUT         => 360,
                CURLOPT_CONNECTTIMEOUT  => 10,
            ],
        ])->timeout(360)->post("{$this->url}/api/generate", [
            'model'   => $this->model,
            'prompt'  => $prompt,
            'stream'  => false,
            'options' => ['num_predict' => $maxTokens],
        ]);

        return $response->json('response') ?? '';
    }

    public function generateJson(string $prompt, int $maxTokens = 400): mixed
    {
        $response = Http::withOptions([
            'curl' => [
                CURLOPT_TIMEOUT        => 360,
                CURLOPT_CONNECTTIMEOUT => 10,
            ],
        ])->timeout(360)->post("{$this->url}/api/chat", [
            'model'  => $this->model,
            'stream' => false,
            'format' => 'json',
            'options' => ['num_predict' => $maxTokens],
            'messages' => [
                [
                    'role'    => 'system',
                    'content' => 'Tu es un expert Merise. Tu réponds UNIQUEMENT avec du JSON valide. Jamais de texte autour.',
                ],
                [
                    'role'    => 'user',
                    'content' => $prompt,
                ],
            ],
        ]);

        return json_decode($response->json('message.content') ?? '{}', true);
    }

    public function chat(array $messages, int $maxTokens = 300): string
    {
        $response = Http::timeout(300)->post("{$this->url}/api/chat", [
            'model'    => $this->model,
            'messages' => $messages,
            'stream'   => false,
            'options'  => ['num_predict' => $maxTokens],
        ]);

        return $response->json('message.content') ?? '';
    }
}
