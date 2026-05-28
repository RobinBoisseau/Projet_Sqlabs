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

    public function generateJson(string $prompt, int $maxTokens = 400, string $systemPrompt = ''): mixed
    {
        $system = $systemPrompt ?: 'Tu es un expert Merise. Tu réponds UNIQUEMENT avec du JSON valide. Jamais de texte autour.';
        $apiKey = config('services.mistral.key');

        $payload = [
            'model'           => 'mistral-small-latest',
            'max_tokens'      => $maxTokens,
            'response_format' => ['type' => 'json_object'],
            'messages'        => [
                ['role' => 'system', 'content' => $system],
                ['role' => 'user',   'content' => $prompt],
            ],
        ];

        $response = Http::withToken($apiKey)
            ->timeout(60)
            ->post('https://api.mistral.ai/v1/chat/completions', $payload);

        $result = json_decode($response->json('choices.0.message.content') ?? '{}', true);

        return $result;
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
