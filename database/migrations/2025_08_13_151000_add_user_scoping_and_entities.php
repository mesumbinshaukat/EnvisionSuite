<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        // Add user_id to core tables
        if (Schema::hasTable('shops') && !Schema::hasColumn('shops', 'user_id')) {
            Schema::table('shops', function (Blueprint $table) {
                $table->foreignId('user_id')->nullable()->after('id')->constrained('users')->nullOnDelete();
            });
        }
        if (Schema::hasTable('products') && !Schema::hasColumn('products', 'user_id')) {
            Schema::table('products', function (Blueprint $table) {
                $table->foreignId('user_id')->nullable()->after('id')->constrained('users')->nullOnDelete();
            });
        }
        if (Schema::hasTable('customers') && !Schema::hasColumn('customers', 'user_id')) {
            Schema::table('customers', function (Blueprint $table) {
                $table->foreignId('user_id')->nullable()->after('id')->constrained('users')->nullOnDelete();
            });
        }
        if (Schema::hasTable('stock_movements') && !Schema::hasColumn('stock_movements', 'owner_user_id')) {
            Schema::table('stock_movements', function (Blueprint $table) {
                // user_id already logs actor; owner_user_id denotes tenant owner
                $table->foreignId('owner_user_id')->nullable()->after('user_id')->constrained('users')->nullOnDelete();
            });
        }

        // Categories
        if (!Schema::hasTable('categories')) {
            Schema::create('categories', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
                $table->foreignId('shop_id')->nullable()->constrained('shops')->nullOnDelete();
                $table->string('name');
                $table->string('type')->nullable(); // e.g., product/service
                $table->text('description')->nullable();
                $table->timestamps();
            });
        }

        // Vendors
        if (!Schema::hasTable('vendors')) {
            Schema::create('vendors', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
                $table->foreignId('shop_id')->nullable()->constrained('shops')->nullOnDelete();
                $table->string('name');
                $table->string('email')->nullable();
                $table->string('phone')->nullable();
                $table->string('address')->nullable();
                $table->decimal('balance', 14, 2)->default(0);
                $table->timestamps();
            });
        }

        // Optional: link products to categories
        if (Schema::hasTable('products') && !Schema::hasColumn('products', 'category_id')) {
            Schema::table('products', function (Blueprint $table) {
                $table->foreignId('category_id')->nullable()->after('shop_id')->constrained('categories')->nullOnDelete();
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('products') && Schema::hasColumn('products', 'category_id')) {
            Schema::table('products', function (Blueprint $table) {
                $table->dropConstrainedForeignId('category_id');
            });
        }
        if (Schema::hasTable('vendors')) {
            Schema::drop('vendors');
        }
        if (Schema::hasTable('categories')) {
            Schema::drop('categories');
        }
        if (Schema::hasTable('stock_movements') && Schema::hasColumn('stock_movements', 'owner_user_id')) {
            Schema::table('stock_movements', function (Blueprint $table) {
                $table->dropConstrainedForeignId('owner_user_id');
            });
        }
        foreach (['shops','products','customers'] as $tableName) {
            if (Schema::hasTable($tableName) && Schema::hasColumn($tableName, 'user_id')) {
                Schema::table($tableName, function (Blueprint $table) use ($tableName) {
                    $table->dropConstrainedForeignId('user_id');
                });
            }
        }
    }
};
