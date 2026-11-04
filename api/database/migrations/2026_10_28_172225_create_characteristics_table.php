<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('characteristics', function (Blueprint $table) {
            $table->id();
            $table->string('gender');
            $table->string('case_shape');
            $table->string('movement_type');
            $table->string('module_caliber_movement_number');
            $table->string('size_perception');
            $table->string('case_material');
            $table->string('main_watch_color');
            $table->string('strap_color');
            $table->string('dial_color');
            $table->string('strap_type');
            $table->string('dial_style');
            $table->string('crystal_type');
            $table->text('crown_and_caseback_type');
            $table->text('functions');
            $table->string('water_resistance');
            $table->string('warranty');
            $table->string('illumination_type');
            $table->string('watch_dimensions');
            $table->string('dial_dimensions');
            $table->string('thickness');
            $table->string('weight');
            $table->string('strap_lug_width');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('characteristic');
    }
};
