<?php

declare(strict_types=1);

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
        Schema::create('upazilas', function (Blueprint $table) {
            $table->id();
            $table->foreignId('district_id')
                ->constrained('districts')
                ->cascadeOnDelete();
            $table->string('name');
            $table->string('bn_name')->nullable();
            $table->foreignId('shipping_zone_id')
                ->nullable()
                ->constrained('shipping_zones')
                ->nullOnDelete();
            $table->timestamps();

            $table->index(['district_id', 'name']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('upazilas');
    }
};
