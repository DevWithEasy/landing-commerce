<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payment_methods', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('code')->unique(); // 'cod', 'bkash', 'nagad', 'rocket'
            $table->text('description')->nullable();
            $table->text('instructions')->nullable();
            $table->string('account_number')->nullable();
            $table->boolean('is_active')->default(false);
            $table->boolean('is_online')->default(false);
            $table->boolean('requires_transaction_id')->default(false);
            $table->integer('sort_order')->default(0);
            $table->softDeletes();
            $table->timestamps();

            $table->index(['is_active', 'sort_order']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payment_methods');
    }
};
