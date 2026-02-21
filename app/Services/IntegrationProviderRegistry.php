<?php

namespace App\Services;

use App\Integrations\Contracts\IntegrationProvider;
use App\Integrations\Providers\AuvikProvider;
use App\Integrations\Providers\ConnectWiseProvider;
use App\Integrations\Providers\CustomProvider;
use App\Integrations\Providers\ItGlueProvider;
use App\Integrations\Providers\KaseyaProvider;
use Illuminate\Contracts\Container\Container;
use InvalidArgumentException;

class IntegrationProviderRegistry
{
    /**
     * @var array<string, class-string<IntegrationProvider>>
     */
    private array $providerMap = [
        'connectwise' => ConnectWiseProvider::class,
        'it_glue' => ItGlueProvider::class,
        'kaseya' => KaseyaProvider::class,
        'auvik' => AuvikProvider::class,
        'custom' => CustomProvider::class,
    ];

    public function __construct(
        private readonly Container $container
    ) {}

    public function resolve(string $provider): IntegrationProvider
    {
        $class = $this->providerMap[$provider] ?? null;

        if (!$class) {
            throw new InvalidArgumentException("Unsupported integration provider: {$provider}");
        }

        /** @var IntegrationProvider $instance */
        $instance = $this->container->make($class);

        return $instance;
    }

    /**
     * @return array<string, string>
     */
    public function options(): array
    {
        $options = [];

        foreach ($this->providerMap as $key => $class) {
            /** @var IntegrationProvider $provider */
            $provider = $this->container->make($class);
            $options[$key] = $provider->displayName();
        }

        return $options;
    }
}
