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
        Schema::table('products', function (Blueprint $table) {
            if (! Schema::hasColumn('products', 'combo_pack_size')) {
                $table->unsignedTinyInteger('combo_pack_size')->default(1)->after('has_variants');
            }
            if (! Schema::hasColumn('products', 'combo_colors')) {
                $table->json('combo_colors')->nullable()->after('combo_pack_size');
            }
            if (! Schema::hasColumn('products', 'combo_sizes')) {
                $table->json('combo_sizes')->nullable()->after('combo_colors');
            }
        });

        Schema::table('cart_items', function (Blueprint $table) {
            if (! Schema::hasColumn('cart_items', 'combo_summary')) {
                $table->string('combo_summary', 500)->nullable()->after('variant_id');
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('cart_items', function (Blueprint $table) {
            if (Schema::hasColumn('cart_items', 'combo_summary')) {
                $table->dropColumn('combo_summary');
            }
        });

        Schema::table('products', function (Blueprint $table) {
            if (Schema::hasColumn('products', 'combo_sizes')) {
                $table->dropColumn('combo_sizes');
            }
            if (Schema::hasColumn('products', 'combo_colors')) {
                $table->dropColumn('combo_colors');
            }
            if (Schema::hasColumn('products', 'combo_pack_size')) {
                $table->dropColumn('combo_pack_size');
            }
        });
    }
};
