<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Characteristic extends Model
{
    use HasFactory;

    protected $fillable = [
        'gender',
        'case_shape',
        'movement_type',
        'module_caliber_movement_number',
        'size_perception',
        'case_material',
        'main_watch_color',
        'strap_color',
        'dial_color',
        'strap_type',
        'dial_style',
        'crystal_type',
        'crown_and_caseback_type',
        'functions',
        'water_resistance',
        'warranty',
        'illumination_type',
        'watch_dimensions',
        'dial_dimensions',
        'thickness',
        'weight',
        'strap_lug_width',
    ];

    public function products(): HasMany
    {
        return $this->hasMany(Product::class, 'characteristics_id');
    }
}