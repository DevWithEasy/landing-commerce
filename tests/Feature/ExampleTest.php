<?php

use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

test('the application root returns a successful response', function () {
    $response = $this->getJson('/');

    $response->assertStatus(200);
    $response->assertJson([
        'status' => 'ok',
        'app' => 'Landing Commerce',
    ]);
});
