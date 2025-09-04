<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (!Schema::hasColumn('shops', 'location')) {
            Schema::table('shops', function (Blueprint $table) {
                $table->string('location')->nullable()->after('name');
            });
        }
    }

    public function down(): void
    {
        if (Schema::hasColumn('shops', 'location')) {
            Schema::table('shops', function (Blueprint $table) {
                $table->dropColumn('location');
            });
        }
    }
};
