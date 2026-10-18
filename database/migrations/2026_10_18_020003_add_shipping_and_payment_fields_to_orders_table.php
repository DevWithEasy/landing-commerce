<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->foreignId('shipping_method_id')->nullable()->after('shipping_fee')->constrained('shipping_methods')->nullOnDelete();
            $table->string('shipping_method_name')->nullable()->after('shipping_method_id');
            $table->string('payment_status')->default('unpaid')->after('payment_method');
            $table->string('payment_transaction_id')->nullable()->after('payment_status');
            $table->json('payment_details')->nullable()->after('payment_transaction_id');
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropForeign(['shipping_method_id']);
            $table->dropColumn([
                'shipping_method_id',
                'shipping_method_name',
                'payment_status',
                'payment_transaction_id',
                'payment_details',
            ]);
        });
    }
};
