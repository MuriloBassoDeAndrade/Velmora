<?php

namespace App\Support;

use InvalidArgumentException;

/**
 * Operações com dinheiro em centavos (inteiros), sem ponto flutuante.
 *
 * O banco guarda decimal(10,2). Aqui convertemos o texto "999.90" para 99990
 * centavos, fazemos as contas com inteiros e formatamos de volta para "999.90".
 */
final class Money
{
    public static function toCents(string|int $amount): int
    {
        $value = trim((string) $amount);

        if (!preg_match('/^(-)?(\d+)(?:\.(\d{1,2})\d*)?$/', $value, $matches)) {
            throw new InvalidArgumentException("Invalid monetary value: {$value}");
        }

        $negative = $matches[1] === '-';
        $units = (int) $matches[2];
        $fraction = (int) str_pad($matches[3] ?? '0', 2, '0');

        $cents = $units * 100 + $fraction;

        return $negative ? -$cents : $cents;
    }

    public static function multiply(string|int $unitPrice, int $quantity): int
    {
        return self::toCents($unitPrice) * $quantity;
    }

    public static function format(int $cents): string
    {
        $sign = $cents < 0 ? '-' : '';
        $cents = abs($cents);

        return sprintf('%s%d.%02d', $sign, intdiv($cents, 100), $cents % 100);
    }
}
