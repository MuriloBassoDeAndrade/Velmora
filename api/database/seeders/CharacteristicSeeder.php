<?php

namespace Database\Seeders;

use App\Models\Characteristic;
use Illuminate\Database\Seeder;


class CharacteristicSeeder extends Seeder
{
    public function run(): void
    {
        $characteristics = [

            // 1 - Casio Duro MDV-106-1A
            1 => [
                'gender' => 'Masculino',
                'case_shape' => 'Redonda',
                'movement_type' => 'Quartzo analógico (precisão de ±20 segundos por mês)',
                'module_caliber_movement_number' => 'Quartzo Casio, bateria SR626SW (cerca de 3 anos)',
                'size_perception' => 'Grande',
                'case_material' => 'Aço inoxidável, com bisel de alumínio',
                'main_watch_color' => 'Preto',
                'strap_color' => 'Preto',
                'dial_color' => 'Preto',
                'strap_type' => 'Pulseira de resina',
                'dial_style' => 'Analógico, com marcadores em barra e janela de data',
                'crystal_type' => 'Vidro mineral',
                'crown_and_caseback_type' => 'Coroa rosqueável (screw lock) e fundo de caixa rosqueado, com o marlin gravado',
                'functions' => 'Horas, minutos, segundos e data; bisel giratório unidirecional',
                'water_resistance' => '200 m',
                'warranty' => '1 ano (garantia do fabricante)',
                'illumination_type' => 'Ponteiros e marcadores com áreas fluorescentes',
                'watch_dimensions' => '48,5 x 44,2 x 12,1 mm',
                'dial_dimensions' => '33 mm',
                'thickness' => '12,1 mm',
                'weight' => '92 g',
                'strap_lug_width' => '22 mm',
            ],

            // 2 - Seiko 5 Sports SRPD55K1
            2 => [
                'gender' => 'Masculino',
                'case_shape' => 'Redonda',
                'movement_type' => 'Automático com corda manual, 24 rubis, reserva de marcha de cerca de 41 horas',
                'module_caliber_movement_number' => 'Calibre Seiko 4R36',
                'size_perception' => 'Grande',
                'case_material' => 'Aço inoxidável',
                'main_watch_color' => 'Prateado',
                'strap_color' => 'Prateado',
                'dial_color' => 'Preto',
                'strap_type' => 'Pulseira de aço inoxidável com fecho triplo de trava e botão',
                'dial_style' => 'Analógico, com janela de dia e data às 3 horas e marcadores LumiBrite',
                'crystal_type' => 'Hardlex',
                'crown_and_caseback_type' => 'Coroa às 4 horas; fundo de caixa transparente e rosqueado',
                'functions' => 'Horas, minutos e segundos com parada de segundos; dia e data; bisel giratório unidirecional',
                'water_resistance' => '100 m (10 bar)',
                'warranty' => 'Garantia do fabricante (confira o prazo no certificado)',
                'illumination_type' => 'LumiBrite nos ponteiros e índices',
                'watch_dimensions' => '42,5 mm de diâmetro x 46,0 mm (lug to lug) x 13,4 mm',
                'dial_dimensions' => '31 mm',
                'thickness' => '13,4 mm',
                'weight' => '170 g',
                'strap_lug_width' => '22 mm',
            ],

            // 3 - Orient Bambino Version 4 FAC08003A0
            3 => [
                'gender' => 'Masculino',
                'case_shape' => 'Redonda',
                'movement_type' => 'Automático com corda manual e parada de segundos, 22 rubis, 21.600 vph, reserva de marcha de cerca de 40 horas',
                'module_caliber_movement_number' => 'Calibre Orient F6724',
                'size_perception' => 'Grande',
                'case_material' => 'Aço inoxidável',
                'main_watch_color' => 'Prateado',
                'strap_color' => 'Marrom (camurça)',
                'dial_color' => 'Cinza',
                'strap_type' => 'Pulseira de camurça com fivela',
                'dial_style' => 'Analógico clássico, com índices e ponteiros dourados e data às 3 horas',
                'crystal_type' => 'Vidro mineral abaulado',
                'crown_and_caseback_type' => 'Coroa de empurrar e puxar; fundo de caixa sólido preso por parafusos',
                'functions' => 'Horas, minutos, segundos e data',
                'water_resistance' => '30 m',
                'warranty' => '1 ano (garantia internacional Orient)',
                'illumination_type' => 'Sem material luminescente',
                'watch_dimensions' => '42 mm de diâmetro x 48,2 mm (lug to lug) x 11,8 mm',
                'dial_dimensions' => '37 mm',
                'thickness' => '11,8 mm',
                'weight' => '65 g',
                'strap_lug_width' => '22 mm',
            ],

            // 4 - Tissot PRX Powermatic 80 40 mm T137.407.11.041.00
            4 => [
                'gender' => 'Masculino',
                'case_shape' => 'Redonda, com bracelete integrado à caixa',
                'movement_type' => 'Automático suíço, reserva de marcha de 80 horas, espiral Nivachron',
                'module_caliber_movement_number' => 'Powermatic 80 (calibre 11 1/2 linhas, 25,6 mm)',
                'size_perception' => 'Médio',
                'case_material' => 'Aço inoxidável 316L',
                'main_watch_color' => 'Prateado',
                'strap_color' => 'Prateado',
                'dial_color' => 'Azul',
                'strap_type' => 'Bracelete integrado de aço inoxidável com fecho dobrável',
                'dial_style' => 'Analógico, com índices em barra, padrão texturizado e janela de data',
                'crystal_type' => 'Safira com tratamento antirreflexo',
                'crown_and_caseback_type' => 'Fundo de caixa transparente',
                'functions' => 'Horas, minutos, segundos e data',
                'water_resistance' => '100 m (10 bar)',
                'warranty' => '2 anos (garantia Tissot)',
                'illumination_type' => 'Super-LumiNova nos ponteiros',
                'watch_dimensions' => '40 mm de diâmetro x 10,93 mm de espessura',
                'dial_dimensions' => '32 mm',
                'thickness' => '10,93 mm',
                'weight' => '138 g',
                'strap_lug_width' => '12 mm',
            ],

            // 5 - Tissot PRX Powermatic 80 35 mm T137.207.11.041.00
            5 => [
                'gender' => 'Feminino',
                'case_shape' => 'Redonda, com bracelete integrado à caixa',
                'movement_type' => 'Automático suíço, reserva de marcha de 80 horas, espiral Nivachron',
                'module_caliber_movement_number' => 'Powermatic 80',
                'size_perception' => 'Pequeno',
                'case_material' => 'Aço inoxidável 316L',
                'main_watch_color' => 'Prateado',
                'strap_color' => 'Prateado',
                'dial_color' => 'Azul',
                'strap_type' => 'Bracelete integrado de aço inoxidável com fecho dobrável',
                'dial_style' => 'Analógico, com índices em barra e padrão texturizado',
                'crystal_type' => 'Safira com tratamento antirreflexo',
                'crown_and_caseback_type' => 'Fundo de caixa transparente',
                'functions' => 'Horas, minutos e segundos',
                'water_resistance' => '100 m (10 bar)',
                'warranty' => '2 anos (garantia Tissot)',
                'illumination_type' => 'Super-LumiNova nos ponteiros',
                'watch_dimensions' => '35 mm de diâmetro x 39 mm (lug to lug) x 10,93 mm',
                'dial_dimensions' => '28 mm',
                'thickness' => '10,93 mm',
                'weight' => '104 g',
                'strap_lug_width' => '12 mm',
            ],

            // 6 - Casio Vintage LA680WGA-1B
            6 => [
                'gender' => 'Feminino',
                'case_shape' => 'Retangular com cantos chanfrados (octogonal)',
                'movement_type' => 'Quartzo digital, bateria CR1616 (cerca de 5 anos)',
                'module_caliber_movement_number' => 'Quartzo Casio',
                'size_perception' => 'Pequeno',
                'case_material' => 'Resina com acabamento dourado',
                'main_watch_color' => 'Dourado',
                'strap_color' => 'Dourado',
                'dial_color' => 'Preto',
                'strap_type' => 'Pulseira de aço inoxidável dourada',
                'dial_style' => 'Digital (display LCD)',
                'crystal_type' => 'Resina (acrílico)',
                'crown_and_caseback_type' => 'Sem coroa (ajustes por botões laterais); fundo de caixa rosqueado',
                'functions' => 'Hora, calendário automático, cronômetro de 1/100 s até 1 hora, alarme diário, formato 12 ou 24 horas',
                'water_resistance' => '30 m (3 ATM)',
                'warranty' => '1 ano (garantia do fabricante)',
                'illumination_type' => 'Luz de LED',
                'watch_dimensions' => '33,5 x 28,6 x 8,6 mm',
                'dial_dimensions' => '21 x 15 mm',
                'thickness' => '8,6 mm',
                'weight' => '36 g',
                'strap_lug_width' => '14 mm',
            ],

            // 7 - Casio LTP-1183A-7A
            7 => [
                'gender' => 'Feminino',
                'case_shape' => 'Redonda',
                'movement_type' => 'Quartzo analógico (precisão de ±20 segundos por mês)',
                'module_caliber_movement_number' => 'Quartzo Casio',
                'size_perception' => 'Pequeno',
                'case_material' => 'Aço com acabamento ion plated',
                'main_watch_color' => 'Prateado',
                'strap_color' => 'Prateado',
                'dial_color' => 'Branco',
                'strap_type' => 'Pulseira de aço inoxidável com fecho triplo',
                'dial_style' => 'Analógico, com janela de data',
                'crystal_type' => 'Vidro mineral',
                'crown_and_caseback_type' => 'Coroa simples; fundo de caixa de aço',
                'functions' => 'Horas, minutos, segundos e data',
                'water_resistance' => '30 m (3 bar)',
                'warranty' => '1 ano (garantia do fabricante)',
                'illumination_type' => 'Sem iluminação',
                'watch_dimensions' => '31,5 x 28,5 x 6,6 mm',
                'dial_dimensions' => '24 mm',
                'thickness' => '6,6 mm',
                'weight' => '51 g',
                'strap_lug_width' => '14 mm',
            ],
        ];

        foreach ($characteristics as $id => $data) {
            Characteristic::updateOrCreate(['id' => $id], $data);
        }
    }
}