<?php

namespace Tests\Unit;

use App\Support\Money;
use InvalidArgumentException;
use PHPUnit\Framework\TestCase;

class MoneyTest extends TestCase
{
    public function test_converts_decimal_text_to_cents_without_float(): void
    {
        $this->assertSame(99990, Money::toCents('999.90'));
        $this->assertSame(10, Money::toCents('0.10'));
        $this->assertSame(5, Money::toCents('0.05'));
        $this->assertSame(1999, Money::toCents('19.99'));
        $this->assertSame(1000, Money::toCents('10'));
        $this->assertSame(1050, Money::toCents('10.5'));
        $this->assertSame(-250, Money::toCents('-2.50'));
    }

    public function test_formats_cents_with_two_decimals(): void
    {
        $this->assertSame('999.90', Money::format(99990));
        $this->assertSame('0.05', Money::format(5));
        $this->assertSame('0.00', Money::format(0));
        $this->assertSame('-2.50', Money::format(-250));
    }

    public function test_multiplication_is_exact(): void
    {
        // 0.1 * 3 em float dá 0.30000000000000004
        $this->assertSame(30, Money::multiply('0.10', 3));
        $this->assertSame('59.97', Money::format(Money::multiply('19.99', 3)));
    }

    public function test_rejects_invalid_values(): void
    {
        $this->expectException(InvalidArgumentException::class);

        Money::toCents('abc');
    }
}
