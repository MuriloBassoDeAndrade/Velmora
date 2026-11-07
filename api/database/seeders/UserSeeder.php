
<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        $password = env('SEEDER_DEFAULT_PASSWORD');

        if (empty($password)) {
            throw new \RuntimeException(
                'Configure SEEDER_DEFAULT_PASSWORD no arquivo .env antes de executar os seeders.'
            );
        }

        $admin = User::updateOrCreate(
            ['email' => 'admin@velmora.com'],
            [
                'name' => 'Administrador Velmora',
                'password' => $password,
            ]
        );

        $admin->role = 'admin';
        $admin->save();

        $users = [
            ['name' => 'Ana Cliente', 'email' => 'ana@velmora.com'],
            ['name' => 'Bruno Cliente', 'email' => 'bruno@velmora.com'],
            ['name' => 'Carla Cliente', 'email' => 'carla@velmora.com'],
        ];

        foreach ($users as $data) {
            User::updateOrCreate(
                ['email' => $data['email']],
                [
                    'name' => $data['name'],
                    'password' => $password,
                ]
            );
        }
    }
}
