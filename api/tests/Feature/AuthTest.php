<?php

namespace Tests\Feature;

use App\Models\Cart;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Tests\Concerns\CreatesCatalog;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase, CreatesCatalog;

    private function registerPayload(array $overrides = []): array
    {
        return array_merge([
            'name' => 'Cliente Teste',
            'email' => 'cliente@teste.com',
            'password' => 'senha-segura-123',
            'password_confirmation' => 'senha-segura-123',
        ], $overrides);
    }

    public function test_user_can_register_and_is_logged_in_by_cookie(): void
    {
        $response = $this->fromFrontend()->postJson('/api/register', $this->registerPayload());

        $response->assertCreated()
            ->assertJsonStructure(['user' => ['id', 'name', 'email'], 'cart', 'adjustments'])
            ->assertJsonMissingPath('token')
            ->assertJsonMissingPath('user.password');

        $this->assertDatabaseHas('users', ['email' => 'cliente@teste.com']);
        $this->assertAuthenticated('web');
    }

    public function test_register_does_not_issue_api_token(): void
    {
        $this->fromFrontend()->postJson('/api/register', $this->registerPayload())->assertCreated();

        $this->assertDatabaseCount('personal_access_tokens', 0);
    }

    public function test_registered_user_is_customer_and_role_cannot_be_chosen(): void
    {
        $this->fromFrontend()
            ->postJson('/api/register', $this->registerPayload(['role' => 'admin']))
            ->assertCreated();

        $user = User::query()->where('email', 'cliente@teste.com')->first();
        $this->assertFalse($user->isAdmin());
    }

    public function test_register_validates_fields(): void
    {
        $this->fromFrontend()->postJson('/api/register', [])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['name', 'email', 'password']);

        User::factory()->create(['email' => 'cliente@teste.com']);

        $this->fromFrontend()->postJson('/api/register', $this->registerPayload())
            ->assertStatus(422)->assertJsonValidationErrors(['email']);

        $this->fromFrontend()->postJson('/api/register', $this->registerPayload([
            'email' => 'outro@teste.com',
            'password_confirmation' => 'diferente',
        ]))->assertStatus(422)->assertJsonValidationErrors(['password']);
    }

    public function test_request_without_frontend_origin_is_rejected(): void
    {
        $this->postJson('/api/login', ['email' => 'a@a.com', 'password' => 'x'])
            ->assertStatus(400)
            ->assertJsonStructure(['message']);
    }

    public function test_user_can_login_with_valid_credentials(): void
    {
        User::factory()->create(['email' => 'cliente@teste.com', 'password' => 'senha-segura-123']);

        $this->fromFrontend()->postJson('/api/login', [
            'email' => 'cliente@teste.com',
            'password' => 'senha-segura-123',
        ])->assertOk()
            ->assertJsonPath('user.email', 'cliente@teste.com')
            ->assertJsonMissingPath('token');

        $this->assertAuthenticated('web');
    }

    public function test_login_fails_with_wrong_password_or_unknown_email(): void
    {
        User::factory()->create(['email' => 'cliente@teste.com', 'password' => 'senha-segura-123']);

        $this->fromFrontend()->postJson('/api/login', [
            'email' => 'cliente@teste.com',
            'password' => 'errada',
        ])->assertStatus(401)->assertJson(['message' => 'Invalid credentials']);

        $this->fromFrontend()->postJson('/api/login', [
            'email' => 'naoexiste@teste.com',
            'password' => 'qualquer',
        ])->assertStatus(401);

        $this->assertGuest('web');
    }

    public function test_login_validates_payload(): void
    {
        $this->fromFrontend()->postJson('/api/login', [])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['email', 'password']);
    }

    public function test_login_merges_guest_cart_into_user_cart(): void
    {
        $user = User::factory()->create(['email' => 'cliente@teste.com', 'password' => 'senha-segura-123']);
        $product = $this->createProduct(['stock' => 4]);

        $guestToken = (string) Str::uuid();
        $guestCart = Cart::create(['guest_token' => $guestToken]);
        $guestCart->items()->create(['product_id' => $product->id, 'quantity' => 3]);
        $this->addToCart($user, $product, 3);

        $response = $this->fromFrontend()
            ->withHeader('X-Guest-Token', $guestToken)
            ->postJson('/api/login', ['email' => 'cliente@teste.com', 'password' => 'senha-segura-123'])
            ->assertOk();

        $response->assertJsonPath('cart.user_id', $user->id)
            ->assertJsonPath('cart.items.0.quantity', 4)
            ->assertJsonPath('adjustments.0.final_quantity', 4)
            ->assertJsonPath('adjustments.0.requested_quantity', 6);

        $this->assertDatabaseMissing('carts', ['guest_token' => $guestToken]);
    }

    public function test_register_merges_guest_cart(): void
    {
        $product = $this->createProduct(['stock' => 5]);
        $guestToken = (string) Str::uuid();
        Cart::create(['guest_token' => $guestToken])
            ->items()->create(['product_id' => $product->id, 'quantity' => 2]);

        $this->fromFrontend()
            ->withHeader('X-Guest-Token', $guestToken)
            ->postJson('/api/register', $this->registerPayload())
            ->assertCreated()
            ->assertJsonPath('cart.items.0.quantity', 2)
            ->assertJsonPath('adjustments', []);

        $this->assertDatabaseMissing('carts', ['guest_token' => $guestToken]);
    }

    public function test_login_ignores_unknown_or_invalid_guest_token(): void
    {
        User::factory()->create(['email' => 'cliente@teste.com', 'password' => 'senha-segura-123']);
        $credentials = ['email' => 'cliente@teste.com', 'password' => 'senha-segura-123'];

        $this->fromFrontend()->withHeader('X-Guest-Token', (string) Str::uuid())
            ->postJson('/api/login', $credentials)
            ->assertOk()->assertJsonPath('cart', null);

        $this->fromFrontend()->withHeader('X-Guest-Token', 'nao-e-uuid')
            ->postJson('/api/login', $credentials)
            ->assertOk()->assertJsonPath('cart', null);
    }

    public function test_me_requires_authentication_and_returns_user(): void
    {
        $this->getJson('/api/user')->assertUnauthorized();


        $user = User::factory()->create();

        $this->actingAs($user)->getJson('/api/user')
            ->assertOk()
            ->assertJsonPath('email', $user->email)
            ->assertJsonMissingPath('password');
    }

    public function test_user_can_update_profile_and_change_password(): void
    {

        $user = User::factory()->create([
            'name' => 'Nome antigo',
            'email' => 'cliente@teste.com',
            'password' => 'senha-antiga-123',
        ]);

        $this->actingAs($user)->putJson('/api/user', [
            'name' => 'Nome atualizado',
            'email' => 'cliente.novo@teste.com',
            'current_password' => 'senha-antiga-123',
            'password' => 'senha-nova-123',
            'password_confirmation' => 'senha-nova-123',
        ])->assertOk()
            ->assertJsonPath('name', 'Nome atualizado')
            ->assertJsonPath('email', 'cliente.novo@teste.com')
            ->assertJsonMissingPath('password');

        $this->assertTrue(Hash::check('senha-nova-123', $user->fresh()->password));
    }

    public function test_user_cannot_change_password_with_wrong_current_password(): void
    {

        $user = User::factory()->create(['password' => 'senha-antiga-123']);

        $this->actingAs($user)->putJson('/api/user', [
            'current_password' => 'senha-incorreta',
            'password' => 'senha-nova-123',
            'password_confirmation' => 'senha-nova-123',
        ])->assertStatus(422)
            ->assertJsonValidationErrors(['current_password']);

        $this->assertTrue(Hash::check('senha-antiga-123', $user->fresh()->password));
    }

    public function test_logout_ends_the_session(): void
    {

        $user = User::factory()->create();

        $this->actingAs($user, 'web')->fromFrontend()
            ->postJson('/api/logout')
            ->assertOk()
            ->assertJson(['message' => 'Logged out successfully']);

        $this->assertGuest('web');
    }

    public function test_logout_requires_authentication(): void
    {
        $this->fromFrontend()->postJson('/api/logout')->assertUnauthorized();
    }
}
