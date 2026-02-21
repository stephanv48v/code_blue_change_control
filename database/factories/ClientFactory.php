<?php

namespace Database\Factories;

use App\Models\Client;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class ClientFactory extends Factory
{
    protected $model = Client::class;

    public function definition(): array
    {
        $name = fake()->company();
        
        return [
            'name' => $name,
            'slug' => Str::slug($name),
            'code' => strtoupper(fake()->unique()->lexify('??????')),
            'industry' => fake()->randomElement(['Technology', 'Healthcare', 'Manufacturing', 'Finance', 'Logistics']),
            'address' => fake()->streetAddress(),
            'city' => fake()->city(),
            'state' => fake()->state(),
            'postal_code' => fake()->postcode(),
            'country' => 'NZ',
            'phone' => fake()->phoneNumber(),
            'website' => fake()->url(),
            'is_active' => true,
        ];
    }
}
