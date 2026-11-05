<?php

namespace Database\Seeders;

use App\Models\Product;
use Illuminate\Database\Seeder;
use App\Models\Category;



class ProductSeeder extends Seeder
{

    public function run(): void
    {




        $products = [
            [
                'name' => 'Casio Duro MDV-106-1A',
                'brand' => 'Casio',
                'characteristics_id' => 1,
                'category_id' => 4,
                'description' => 'Relógio de mergulho de quartzo com caixa de aço, bisel giratório unidirecional, coroa rosqueável e resistência à água de 200 m. Pulseira de resina e marcadores luminosos.',
                'price' => 399.90,
                'stock' => 15,
            ],
            [
                'name' => 'Seiko 5 Sports SRPD55K1',
                'brand' => 'Seiko',
                'characteristics_id' => 2,
                'category_id' => 1,
                'description' => 'Automático da linha SKX Sports Style, com calibre 4R36, caixa de 42,5 mm em aço, vidro Hardlex, fundo transparente e resistência à água de 100 m.',
                'price' => 3299.00,
                'stock' => 6,
            ],
            [
                'name' => 'Orient Bambino Version 4 FAC08003A0',
                'brand' => 'Orient',
                'characteristics_id' => 3,
                'category_id' => 2,
                'description' => 'Relógio social automático com mostrador cinza, ponteiros dourados, vidro mineral abaulado e pulseira de camurça. Calibre F6724 com corda manual e parada de segundos.',
                'price' => 1799.90,
                'stock' => 8,
            ],
            [
                'name' => 'Tissot PRX Powermatic 80 40 mm T137.407.11.041.00',
                'brand' => 'Tissot',
                'characteristics_id' => 4,
                'category_id' => 2,
                'description' => 'Automático suíço inspirado no modelo de 1978, com mostrador azul, vidro de safira, bracelete integrado de aço e 80 horas de reserva de marcha.',
                'price' => 7490.00,
                'stock' => 3,
            ],
            [
                'name' => 'Tissot PRX Powermatic 80 35 mm T137.207.11.041.00',
                'brand' => 'Tissot',
                'characteristics_id' => 5,
                'category_id' => 2,
                'description' => 'Versão de 35 mm do PRX automático, com mostrador azul texturizado, vidro de safira, bracelete integrado de aço e resistência à água de 100 m.',
                'price' => 6990.00,
                'stock' => 3,
            ],
            [
                'name' => 'Casio Vintage LA680WGA-1B',
                'brand' => 'Casio',
                'characteristics_id' => 6,
                'category_id' => 2,
                'description' => 'Digital retrô com caixa compacta dourada, pulseira de aço, cronômetro de 1/100 s, alarme diário, calendário automático e luz de LED.',
                'price' => 449.90,
                'stock' => 12,
            ],
            [
                'name' => 'Casio LTP-1183A-7A',
                'brand' => 'Casio',
                'characteristics_id' => 7,
                'category_id' => 2,
                'description' => 'Analógico feminino de quartzo com caixa de 31,5 mm, mostrador branco, vidro mineral, janela de data e pulseira de aço com fecho triplo.',
                'price' => 329.90,
                'stock' => 20,
            ],
        ];

        foreach ($products as $data) {

            Product::updateOrCreate(
                ['name' => $data['name'], 'brand' => $data['brand']],
                $data + ['image_url' => null, 'active' => true],
            );
        }
    }
}