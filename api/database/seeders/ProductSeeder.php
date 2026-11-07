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
        'characteristics_id' => 24,
        'category_id' => 4,
        'description' => 'Relógio de mergulho de quartzo com caixa de aço, bisel giratório unidirecional, coroa rosqueável e resistência à água de 200 m. Pulseira de resina e marcadores luminosos.',
        'price' => 399.90,
        'stock' => 15,
    ],
    [
        'name' => 'Seiko 5 Sports SRPD55K1',
        'brand' => 'Seiko',
        'characteristics_id' => 25,
        'category_id' => 1,
        'description' => 'Automático da linha SKX Sports Style, com calibre 4R36, caixa de 42,5 mm em aço, vidro Hardlex, fundo transparente e resistência à água de 100 m.',
        'price' => 3299.00,
        'stock' => 6,
    ],
    [
        'name' => 'Orient Bambino Version 4 FAC08003A0',
        'brand' => 'Orient',
        'characteristics_id' => 26,
        'category_id' => 2,
        'description' => 'Relógio social automático com mostrador cinza, ponteiros dourados, vidro mineral abaulado e pulseira de camurça. Calibre F6724 com corda manual e parada de segundos.',
        'price' => 1799.90,
        'stock' => 8,
    ],
    [
        'name' => 'Tissot PRX Powermatic 80 40 mm T137.407.11.041.00',
        'brand' => 'Tissot',
        'characteristics_id' => 27,
        'category_id' => 2,
        'description' => 'Automático suíço inspirado no modelo de 1978, com mostrador azul, vidro de safira, bracelete integrado de aço e 80 horas de reserva de marcha.',
        'price' => 7490.00,
        'stock' => 3,
    ],
    [
        'name' => 'Tissot PRX Powermatic 80 35 mm T137.207.11.041.00',
        'brand' => 'Tissot',
        'characteristics_id' => 28,
        'category_id' => 2,
        'description' => 'Versão de 35 mm do PRX automático, com mostrador azul texturizado, vidro de safira, bracelete integrado de aço e resistência à água de 100 m.',
        'price' => 6990.00,
        'stock' => 3,
    ],
    [
        'name' => 'Casio Vintage LA680WGA-1B',
        'brand' => 'Casio',
        'characteristics_id' => 29,
        'category_id' => 2,
        'description' => 'Digital retrô com caixa compacta dourada, pulseira de aço, cronômetro de 1/100 s, alarme diário, calendário automático e luz de LED.',
        'price' => 449.90,
        'stock' => 12,
    ],
    [
        'name' => 'Casio LTP-V007D-7E',
        'brand' => 'Casio',
        'characteristics_id' => 30,
        'category_id' => 2,
        'description' => 'Relógio feminino analógico de quartzo com caixa retangular cromada, mostrador claro, vidro mineral e pulseira de aço inoxidável.',
        'price' => 329.90,
        'stock' => 20,
    ],
    [
        'name' => 'Casio LTP-1183A-7A',
        'brand' => 'Casio',
        'characteristics_id' => 1,
        'category_id' => 2,
        'description' => 'Relógio feminino analógico de quartzo com mostrador branco, caixa compacta e pulseira de aço inoxidável. Possui indicador de data.',
        'price' => 329.90,
        'stock' => 20,
    ],
    [
        'name' => 'Casio LTP-V002D-7B',
        'brand' => 'Casio',
        'characteristics_id' => 2,
        'category_id' => 2,
        'description' => 'Relógio feminino analógico de quartzo com mostrador branco, caixa prateada e pulseira de aço inoxidável. Design clássico e discreto.',
        'price' => 249.90,
        'stock' => 15,
    ],
    [
        'name' => 'Casio MTP-V002D-7B',
        'brand' => 'Casio',
        'characteristics_id' => 3,
        'category_id' => 2,
        'description' => 'Relógio masculino analógico de quartzo com mostrador branco, caixa prateada e pulseira de aço inoxidável. Possui indicador de data.',
        'price' => 279.90,
        'stock' => 18,
    ],
    [
        'name' => 'Casio MTP-V006L-7B',
        'brand' => 'Casio',
        'characteristics_id' => 4,
        'category_id' => 2,
        'description' => 'Relógio masculino analógico de quartzo com mostrador branco, caixa cromada e pulseira de couro preta. Design clássico com indicador de data.',
        'price' => 219.90,
        'stock' => 12,
    ],
    [
        'name' => 'Tissot PRX T137.410.11.041.00',
        'brand' => 'Tissot',
        'characteristics_id' => 5,
        'category_id' => 2,
        'description' => 'Relógio suíço analógico de quartzo com caixa de aço inoxidável, mostrador azul e vidro de safira. Design integrado inspirado nos modelos dos anos 1970.',
        'price' => 3499.90,
        'stock' => 5,
    ],
    [
        'name' => 'Orient Bambino RA-AC0M09E',
        'brand' => 'Orient',
        'characteristics_id' => 6,
        'category_id' => 2,
        'description' => 'Relógio masculino automático com mostrador verde, vidro abaulado e caixa de aço inoxidável. Possui design clássico e fundo transparente.',
        'price' => 1899.90,
        'stock' => 7,
    ],
    [
        'name' => 'Timex Weekender T2N651',
        'brand' => 'Timex',
        'characteristics_id' => 7,
        'category_id' => 3,
        'description' => 'Relógio casual analógico de quartzo com mostrador creme, caixa prateada e pulseira de tecido verde. Design simples e versátil.',
        'price' => 399.90,
        'stock' => 14,
    ],
    [
        'name' => 'Timex Expedition Scout T49961',
        'brand' => 'Timex',
        'characteristics_id' => 8,
        'category_id' => 3,
        'description' => 'Relógio casual de inspiração militar com movimento de quartzo, mostrador preto, pulseira de tecido e iluminação INDIGLO.',
        'price' => 449.90,
        'stock' => 10,
    ],
    [
        'name' => 'Citizen Chandler BM8180-03E',
        'brand' => 'Citizen',
        'characteristics_id' => 9,
        'category_id' => 3,
        'description' => 'Relógio masculino com tecnologia Eco-Drive alimentada por luz, mostrador preto, caixa de aço inoxidável e pulseira de nylon verde. Possui calendário duplo.',
        'price' => 1099.90,
        'stock' => 8,
    ],
    [
        'name' => 'Seiko 5 Sports SRPE53',
        'brand' => 'Seiko',
        'characteristics_id' => 10,
        'category_id' => 3,
        'description' => 'Relógio automático japonês com calibre 4R36, mostrador azul, caixa de aço inoxidável e pulseira metálica. Possui calendário duplo e fundo transparente.',
        'price' => 2199.90,
        'stock' => 6,
    ],
    [
        'name' => 'Seiko 5 Sports SRPE55',
        'brand' => 'Seiko',
        'characteristics_id' => 11,
        'category_id' => 3,
        'description' => 'Relógio automático masculino com mostrador preto, caixa de aço inoxidável e pulseira metálica. Possui calendário duplo e reserva de marcha de aproximadamente 41 horas.',
        'price' => 2199.90,
        'stock' => 6,
    ],
    [
        'name' => 'Casio Edifice EFV-100D-1AV',
        'brand' => 'Casio',
        'characteristics_id' => 12,
        'category_id' => 3,
        'description' => 'Relógio analógico de quartzo com caixa e pulseira de aço inoxidável, mostrador preto e resistência à água de 100 metros.',
        'price' => 599.90,
        'stock' => 12,
    ],
    [
        'name' => 'Casio G-Shock GA-2100-1A',
        'brand' => 'Casio',
        'characteristics_id' => 13,
        'category_id' => 1,
        'description' => 'Relógio esportivo analógico-digital da linha G-Shock com estrutura Carbon Core Guard, resistência a impactos e resistência à água de 200 metros.',
        'price' => 749.90,
        'stock' => 15,
    ],
    [
        'name' => 'Casio G-Shock DW-5600UE-1',
        'brand' => 'Casio',
        'characteristics_id' => 14,
        'category_id' => 1,
        'description' => 'Relógio digital esportivo com estrutura resistente a impactos, iluminação LED Super Illuminator, cronômetro, timer e resistência à água de 200 metros.',
        'price' => 499.90,
        'stock' => 18,
    ],
    [
        'name' => 'Casio G-Shock GA-100-1A1',
        'brand' => 'Casio',
        'characteristics_id' => 15,
        'category_id' => 1,
        'description' => 'Relógio esportivo analógico-digital com resistência a impactos, resistência magnética, cronômetro de alta precisão e resistência à água de 200 metros.',
        'price' => 699.90,
        'stock' => 12,
    ],
    [
        'name' => 'Casio G-Shock DW-6900-1VH',
        'brand' => 'Casio',
        'characteristics_id' => 16,
        'category_id' => 1,
        'description' => 'Relógio digital esportivo com estrutura resistente a impactos, três indicadores gráficos, cronômetro, alarmes e iluminação eletroluminescente.',
        'price' => 549.90,
        'stock' => 10,
    ],
    [
        'name' => 'Seiko 5 Sports SRPD53K1',
        'brand' => 'Seiko',
        'characteristics_id' => 17,
        'category_id' => 1,
        'description' => 'Relógio automático da linha Seiko 5 Sports com calibre 4R36, mostrador azul, bisel azul e vermelho, caixa de aço inoxidável e pulseira metálica.',
        'price' => 2499.90,
        'stock' => 5,
    ],
    [
        'name' => 'Seiko Prospex SRPD29',
        'brand' => 'Seiko',
        'characteristics_id' => 18,
        'category_id' => 1,
        'description' => 'Relógio automático da linha Prospex com resistência à água de 200 metros, coroa rosqueada, bisel rotativo unidirecional e calibre 4R36.',
        'price' => 3299.90,
        'stock' => 4,
    ],
    [
        'name' => 'Citizen Promaster BN0150-28E',
        'brand' => 'Citizen',
        'characteristics_id' => 19,
        'category_id' => 4,
        'description' => 'Relógio de mergulho com tecnologia Eco-Drive, mostrador preto, bisel rotativo unidirecional e resistência à água de 200 metros.',
        'price' => 2499.90,
        'stock' => 5,
    ],
    [
        'name' => 'Orient Diver RA-AA0004E',
        'brand' => 'Orient',
        'characteristics_id' => 20,
        'category_id' => 4,
        'description' => 'Relógio automático de mergulho com calibre F6922, mostrador verde, vidro de safira, bisel rotativo e resistência à água de 200 metros.',
        'price' => 2199.90,
        'stock' => 6,
    ],
    [
        'name' => 'Casio Duro MDV-107-1A3',
        'brand' => 'Casio',
        'characteristics_id' => 21,
        'category_id' => 4,
        'description' => 'Relógio analógico esportivo com visual de mergulho, mostrador preto, detalhes verdes, bisel rotativo e resistência à água de 200 metros.',
        'price' => 699.90,
        'stock' => 9,
    ],
    [
        'name' => 'Seiko 5 Sports SRPE57',
        'brand' => 'Seiko',
        'characteristics_id' => 22,
        'category_id' => 1,
        'description' => 'Relógio automático da linha Seiko 5 Sports com mostrador preto, caixa de aço inoxidável, calibre 4R36 e calendário duplo.',
        'price' => 2199.90,
        'stock' => 7,
    ],
    [
        'name' => 'Tissot PRX T137.410.11.401.00',
        'brand' => 'Tissot',
        'characteristics_id' => 23,
        'category_id' => 2,
        'description' => 'Relógio suíço de quartzo com mostrador roxo, caixa de aço inoxidável 316L, vidro de safira e pulseira metálica integrada.',
        'price' => 3499.90,
        'stock' => 4,
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
