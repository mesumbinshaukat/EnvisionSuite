<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('inventory_loans', function (Blueprint $table) {
            $table->id();
            $table->foreignId('shop_id')->constrained('shops');
            $table->foreignId('product_id')->constrained('products');
            $table->integer('quantity');
            $table->integer('returned_quantity')->default(0);
            $table->enum('status', ['lent','partially_returned','returned'])->default('lent');
            $table->enum('counterparty_type', ['shop','external','customer','vendor'])->default('external');
            $table->foreignId('counterparty_shop_id')->nullable()->constrained('shops')->nullOnDelete();
            $table->string('counterparty_name')->nullable();
            $table->text('notes')->nullable();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('inventory_loans');
    }
};
