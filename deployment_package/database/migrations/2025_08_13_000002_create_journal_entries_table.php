<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (!Schema::hasTable('bk_journal_entries')) {
            Schema::create('bk_journal_entries', function (Blueprint $table) {
                $table->id();
                $table->date('date');
                $table->string('memo')->nullable();
                $table->timestamps();
            });
        }
    }
    public function down(): void
    {
        Schema::dropIfExists('bk_journal_entries');
    }
};
