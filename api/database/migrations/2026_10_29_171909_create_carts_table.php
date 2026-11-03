<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('carts', function (Blueprint $table) {
            $table->id();
            // Sem cascadeOnDelete: o MySQL não aceita CHECK em coluna usada em ação referencial de FK.
            $table->foreignId('user_id')
                ->nullable()
                ->unique()
                ->constrained();
            $table->uuid('guest_token')
                ->nullable()
                ->unique();
            $table->timestamps();
        });

        // O carrinho pertence a um usuário OU a um visitante, nunca aos dois.
        DB::statement('ALTER TABLE carts ADD CONSTRAINT carts_owner_check
            CHECK ((user_id IS NOT NULL) <> (guest_token IS NOT NULL))');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('carts');
    }
};