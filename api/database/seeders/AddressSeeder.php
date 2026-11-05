<?php

namespace Database\Seeders;

use App\Models\Address;
use App\Models\User;
use Illuminate\Database\Seeder;

class AddressSeeder extends Seeder
{
    public function run(): void
    {
        $ana = User::where('email', 'ana@velmora.com')->firstOrFail();
        $bruno = User::where('email', 'bruno@velmora.com')->firstOrFail();
        $carla = User::where('email', 'carla@velmora.com')->firstOrFail();

        $addresses = [
            [$ana, 'Ana Beatriz Cliente', 'Rua das Araucárias', '125', null, 'Centro', 'Curitiba', 'PR', '80010-180'],
            [$ana, 'Ana Beatriz Cliente', 'Rua XV de Novembro', '840', 'Apartamento 501', 'Centro', 'Curitiba', 'PR', '80020-310'],
            [$bruno, 'Bruno Henrique Cliente', 'Rua Doutor Muricy', '340', null, 'Centro', 'Ponta Grossa', 'PR', '84010-090'],
            [$carla, 'Carla Souza Cliente', 'Avenida Paraná', '1820', 'Casa', 'Zona VII', 'Maringá', 'PR', '87020-010'],
        ];

        foreach ($addresses as [$user, $recipient, $street, $number, $complement, $neighborhood, $city, $state, $cep]) {
            Address::updateOrCreate(
                ['user_id' => $user->id, 'recipient_name' => $recipient, 'street' => $street, 'number' => $number],
                compact('complement', 'neighborhood', 'city', 'state', 'cep') + ['user_id' => $user->id, 'recipient_name' => $recipient, 'street' => $street, 'number' => $number]
            );
        }
    }
}
