<?php

namespace Tests\\Feature;

use App\\Models\\User;
use Illuminate\\Foundation\\Testing\\RefreshDatabase;
use Tests\\TestCase;

class ProfileTest extends TestCase
{
    use RefreshDatabase;

    public function test_authenticated_user_can_update_name_and_email(): void
    {
        $user = User::factory()->create([
            'name' => 'Nome Antigo',
            'email' => 'antigo@velmora.test',
        ]);

        $this->actingAs($user)->putJson('/api/user', [
            'name' => 'Nome Novo',
            'email' => 'novo@velmora.test',
        ])->assertOk()
            ->assertJsonPath('name', 'Nome Novo')
            ->assertJsonPath('email', 'novo@velmora.test')
            ->assertJsonMissingPath('password');

        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'name' => 'Nome Novo',
            'email' => 'novo@velmora.test',
        ]);
    }

    public function test_profile_update_rejects_an_email_used_by_another_user(): void
    {
        $user = User::factory()->create();
        User::factory()->create(['email' => 'ocupado@velmora.test']);

        $this->actingAs($user)->putJson('/api/user', [
            'email' => 'ocupado@velmora.test',
        ])->assertUnprocessable()
            ->assertJsonValidationErrors(['email']);
    }

    public function test_password_change_requires_the_current_password(): void
    {
        $user = User::factory()->create(['password' => 'senha-antiga-123']);

        $this->actingAs($user)->putJson('/api/user', [
            'password' => 'senha-nova-123',
            'password_confirmation' => 'senha-nova-123',
        ])->assertUnprocessable()
            ->assertJsonValidationErrors(['current_password']);
    }

    public function test_user_can_change_password_with_current_password(): void
    {
        $user = User::factory()->create(['password' => 'senha-antiga-123']);

        $this->actingAs($user)->putJson('/api/user', [
            'password' => 'senha-nova-123',
            'password_confirmation' => 'senha-nova-123',
            'current_password' => 'senha-antiga-123',
        ])->assertOk();

        $this->assertTrue(password_verify('senha-nova-123', $user->fresh()->password));
    }

    public function test_profile_update_requires_authentication(): void
    {
        $this->putJson('/api/user', ['name' => 'Não autenticado'])
            ->assertUnauthorized();
    }
}
