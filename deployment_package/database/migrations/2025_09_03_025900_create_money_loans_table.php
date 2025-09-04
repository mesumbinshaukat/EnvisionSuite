<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('money_loans', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('shop_id')->nullable();
            $table->enum('counterparty_type', ['vendor','external']);
            $table->unsignedBigInteger('vendor_id')->nullable();
            $table->string('counterparty_name')->nullable();
            $table->enum('direction', ['lend','borrow']); // lend = we give money; borrow = we take money
            $table->enum('source', ['cash','bank']); // where cash movement happens
            $table->decimal('amount', 12, 2);
            $table->date('date')->nullable();
            $table->text('note')->nullable();
            $table->unsignedBigInteger('user_id')->nullable();
            $table->timestamps();

            $table->index(['shop_id']);
            $table->index(['vendor_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('money_loans');
    }
};
