<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{

    

    public function run(): void
    {
        $password = env('SEEDER_DEFAULT_PASSWORD');

        $admin = User::updateOrCreate(
            ['email' => 'admin@velmora.com'],
            ['name' => 'Administrador Velmora', 'password' => Hash::make($password)]
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
                ['name' => $data['name'], 'password' => Hash::make('Velmora123!'), ]
            );
        }
    }
}
