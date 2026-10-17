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
        Schema::create('landing_pages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')->nullable()->constrained('products')->nullOnDelete();
            $table->string('title');
            $table->string('slug')->unique();
            $table->boolean('is_default')->default(false);
            $table->string('status')->default('draft'); // draft, published, archived
            $table->json('meta_seo')->nullable();
            $table->unsignedBigInteger('published_revision_id')->nullable();
            $table->timestamps();

            $table->index(['status', 'slug']);
        });

        Schema::create('landing_page_revisions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('landing_page_id')->constrained('landing_pages')->cascadeOnDelete();
            $table->integer('revision_number');
            $table->json('ast_content');
            $table->string('created_by')->nullable();
            $table->timestamps();

            $table->index(['landing_page_id', 'revision_number']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('landing_page_revisions');
        Schema::dropIfExists('landing_pages');
    }
};
