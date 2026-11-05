<?php

namespace Database\Seeders;

use App\Models\Category;
use Illuminate\Database\Seeder;

class CategorySeeder extends Seeder
{
    public function run(): void
    {
        foreach ([
            ['name' => 'Esportivo', 'slug' => 'esportivo'],
            ['name' => 'Social', 'slug' => 'social'],
            ['name' => 'Casual', 'slug' => 'casual'],
        ] as $data) {
            Category::updateOrCreate(['slug' => $data['slug']], $data);
        }
    }
}
