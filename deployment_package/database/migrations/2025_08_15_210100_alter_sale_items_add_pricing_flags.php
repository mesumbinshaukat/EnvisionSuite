<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('sale_items', function (Blueprint $table) {
            $table->decimal('original_unit_price', 12, 2)->default(0)->after('unit_price');
            $table->decimal('sold_unit_price', 12, 2)->default(0)->after('original_unit_price');
            $table->boolean('is_discounted')->default(false)->after('sold_unit_price');
            $table->decimal('margin_per_unit', 12, 2)->default(0)->after('is_discounted');
            $table->decimal('margin_total', 14, 2)->default(0)->after('margin_per_unit');
        });
    }

    public function down(): void
    {
        Schema::table('sale_items', function (Blueprint $table) {
            $table->dropColumn(['original_unit_price','sold_unit_price','is_discounted','margin_per_unit','margin_total']);
        });
    }
};
