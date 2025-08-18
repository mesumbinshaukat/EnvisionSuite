<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void {
        Schema::table('products', function (Blueprint $table) {
            $table->foreignId('shop_id')->nullable()->after('id')->constrained('shops');
        });
        Schema::table('customers', function (Blueprint $table) {
            $table->foreignId('shop_id')->nullable()->after('id')->constrained('shops');
        });
        Schema::table('sales', function (Blueprint $table) {
            $table->foreignId('shop_id')->nullable()->after('id')->constrained('shops');
        });
        Schema::table('sale_items', function (Blueprint $table) {
            $table->foreignId('shop_id')->nullable()->after('id')->constrained('shops');
        });
    }
    public function down(): void {
        Schema::table('sale_items', function (Blueprint $table) {
            $table->dropConstrainedForeignId('shop_id');
        });
        Schema::table('sales', function (Blueprint $table) {
            $table->dropConstrainedForeignId('shop_id');
        });
        Schema::table('customers', function (Blueprint $table) {
            $table->dropConstrainedForeignId('shop_id');
        });
        Schema::table('products', function (Blueprint $table) {
            $table->dropConstrainedForeignId('shop_id');
        });
    }
};
