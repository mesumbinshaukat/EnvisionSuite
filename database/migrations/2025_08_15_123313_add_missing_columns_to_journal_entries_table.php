<?php

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
        Schema::table('bk_journal_entries', function (Blueprint $table) {
            if (!Schema::hasColumn('bk_journal_entries', 'shop_id')) {
                $table->unsignedBigInteger('shop_id')->nullable();
                $table->index('shop_id', 'bk_je_shop_id_idx');
            }
            if (!Schema::hasColumn('bk_journal_entries', 'user_id')) {
                $table->unsignedBigInteger('user_id')->nullable();
                $table->index('user_id', 'bk_je_user_id_idx');
            }
            if (!Schema::hasColumn('bk_journal_entries', 'reference_type')) {
                $table->string('reference_type', 120)->nullable();
            }
            if (!Schema::hasColumn('bk_journal_entries', 'reference_id')) {
                $table->unsignedBigInteger('reference_id')->nullable();
            }
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('bk_journal_entries', function (Blueprint $table) {
            if (Schema::hasColumn('bk_journal_entries', 'shop_id')) {
                $table->dropIndex('bk_je_shop_id_idx');
            }
            if (Schema::hasColumn('bk_journal_entries', 'user_id')) {
                $table->dropIndex('bk_je_user_id_idx');
            }
            $drop = [];
            foreach (['shop_id','user_id','reference_type','reference_id'] as $col) {
                if (Schema::hasColumn('bk_journal_entries', $col)) {
                    $drop[] = $col;
                }
            }
            if (!empty($drop)) {
                $table->dropColumn($drop);
            }
        });
    }
};

