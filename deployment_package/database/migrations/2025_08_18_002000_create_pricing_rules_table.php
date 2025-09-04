<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('pricing_rules', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('shop_id')->nullable();
            $table->unsignedBigInteger('product_id');
            $table->enum('cost_basis', ['last','average','fixed'])->default('average');
            $table->decimal('fixed_cost', 12, 4)->nullable();
            $table->enum('margin_type', ['percent','amount'])->default('percent');
            $table->decimal('margin_value', 12, 4)->default(0);
            $table->enum('scope_type', ['all_units','specific_qty'])->default('all_units');
            $table->unsignedInteger('scope_qty')->nullable();
            $table->enum('discount_type', ['none','percent','amount'])->default('none');
            $table->decimal('discount_value', 12, 4)->default(0);
            $table->boolean('active')->default(true);
            $table->timestamp('starts_at')->nullable();
            $table->timestamp('ends_at')->nullable();
            $table->text('notes')->nullable();
            $table->unsignedBigInteger('created_by')->nullable();
            $table->unsignedBigInteger('updated_by')->nullable();
            $table->timestamps();

            $table->index(['product_id','shop_id','active']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pricing_rules');
    }
};
