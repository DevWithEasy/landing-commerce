<?php

test('the application root returns a successful response', function () {
    $response = $this->get('/');

    $response->assertStatus(200);
    $response->assertJson([
        'status' => 'ok',
        'app' => 'Landing Commerce',
    ]);
});
