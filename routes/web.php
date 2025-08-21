<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\CustomerController;
use App\Http\Controllers\SaleController;
use App\Http\Controllers\POSController;
use App\Http\Controllers\LedgerController;
use App\Http\Controllers\ShopController;
use App\Http\Controllers\ReportingController;
use App\Http\Controllers\StockMovementController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\VendorController;
use App\Http\Controllers\InventoryLoanController;
use App\Http\Controllers\POSReportController;
use App\Http\Controllers\AccountingReportController;
use App\Http\Controllers\FinancialReportController;
use App\Http\Controllers\PurchaseController;
use App\Http\Controllers\PricingController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('Landing');
});

Route::get('/dashboard', [DashboardController::class, 'index'])
    ->middleware(['auth', 'verified'])
    ->name('dashboard');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');

    // POS + Catalog
    Route::resource('products', ProductController::class);
    Route::resource('customers', CustomerController::class);
    Route::resource('sales', SaleController::class)->only(['index','show','store','create']);
    Route::get('pos', [POSController::class, 'index'])->name('pos.index');
    Route::post('pos/checkout', [POSController::class, 'checkout'])->name('pos.checkout');

    // Ledger summary
    Route::get('/ledger', [LedgerController::class, 'index'])->name('ledger.index');

    // Shops (auth; controller enforces admin/superadmin abilities)
    Route::get('/shops', [ShopController::class, 'index'])->name('shops.index');
    Route::post('/shops/switch/{id}', [ShopController::class, 'switch'])->name('shops.switch');
    Route::get('/shops/create', [ShopController::class, 'create'])->name('shops.create');
    Route::post('/shops', [ShopController::class, 'store'])->name('shops.store');

    // Reports (auth; controller filters by role/user)
    Route::get('/reports/sales', [ReportingController::class, 'sales'])->name('reports.sales');
    Route::get('/reports/sales/export', [ReportingController::class, 'salesExport'])->name('reports.sales.export');
    Route::get('/reports/inventory', [ReportingController::class, 'inventory'])->name('reports.inventory');
    Route::get('/reports/inventory/export', [ReportingController::class, 'inventoryExport'])->name('reports.inventory.export');

    // POS reports
    Route::get('/reports/pos', [POSReportController::class, 'index'])->name('reports.pos');
    Route::get('/reports/pos/export', [POSReportController::class, 'export'])->name('reports.pos.export');

    // Accounting reports
    Route::get('/reports/accounting/customer-aging', [AccountingReportController::class, 'customerAging'])->name('reports.accounting.customerAging');
    Route::get('/reports/accounting/customer-aging/export', [AccountingReportController::class, 'customerAgingExport'])->name('reports.accounting.customerAging.export');
    Route::get('/reports/accounting/vendor-balances', [AccountingReportController::class, 'vendorBalances'])->name('reports.accounting.vendorBalances');
    Route::get('/reports/accounting/vendor-balances/export', [AccountingReportController::class, 'vendorBalancesExport'])->name('reports.accounting.vendorBalances.export');

    // Financial statements
    Route::get('/reports/accounting/journals', [FinancialReportController::class, 'journals'])->name('reports.accounting.journals');
    Route::get('/reports/accounting/journals/export', [FinancialReportController::class, 'journalsExport'])->name('reports.accounting.journals.export');
    Route::get('/reports/accounting/trial-balance', [FinancialReportController::class, 'trialBalance'])->name('reports.accounting.trialBalance');
    Route::get('/reports/accounting/trial-balance/export', [FinancialReportController::class, 'trialBalanceExport'])->name('reports.accounting.trialBalance.export');
    Route::get('/reports/accounting/profit-loss', [FinancialReportController::class, 'profitLoss'])->name('reports.accounting.profitLoss');
    Route::get('/reports/accounting/profit-loss/export', [FinancialReportController::class, 'profitLossExport'])->name('reports.accounting.profitLoss.export');

    // Inventory adjustments (auth; controller enforces admin/superadmin abilities)
    Route::get('/inventory/adjustments', [StockMovementController::class, 'index'])->name('inventory.adjustments.index');
    Route::get('/inventory/adjustments/create', [StockMovementController::class, 'create'])->name('inventory.adjustments.create');
    Route::post('/inventory/adjustments', [StockMovementController::class, 'store'])->name('inventory.adjustments.store');

    // Inventory Loans
    Route::get('/inventory/loans', [InventoryLoanController::class, 'index'])->name('inventory.loans.index');
    Route::get('/inventory/loans/create', [InventoryLoanController::class, 'create'])->name('inventory.loans.create');
    Route::post('/inventory/loans', [InventoryLoanController::class, 'store'])->name('inventory.loans.store');

    // Purchases
    Route::get('/purchases', [PurchaseController::class, 'index'])->name('purchases.index');
    Route::get('/purchases/create', [PurchaseController::class, 'create'])->name('purchases.create');
    Route::post('/purchases', [PurchaseController::class, 'store'])->name('purchases.store');

    // Purchase Reports
    Route::get('/reports/purchases', [ReportingController::class, 'purchases'])->name('reports.purchases');
    Route::get('/reports/purchases/export', [ReportingController::class, 'purchasesExport'])->name('reports.purchases.export');

    // Categories (auth; per-admin scoped)
    Route::resource('categories', CategoryController::class);

    // Vendors (auth; per-admin scoped)
    Route::resource('vendors', VendorController::class)->except(['show']);

    // Pricing Rules
    Route::get('/pricing', [PricingController::class, 'index'])->name('pricing.index');
    Route::get('/pricing/create', [PricingController::class, 'create'])->name('pricing.create');
    Route::post('/pricing', [PricingController::class, 'store'])->name('pricing.store');
    Route::get('/pricing/{rule}/edit', [PricingController::class, 'edit'])->name('pricing.edit');
    Route::put('/pricing/{rule}', [PricingController::class, 'update'])->name('pricing.update');
    Route::delete('/pricing/{rule}', [PricingController::class, 'destroy'])->name('pricing.destroy');
    Route::get('/pricing/compute', [PricingController::class, 'compute'])->name('pricing.compute');

    // Expenses
    Route::get('/expenses', [\App\Http\Controllers\ExpenseController::class, 'index'])->name('expenses.index');
    Route::get('/expenses/create', [\App\Http\Controllers\ExpenseController::class, 'create'])->name('expenses.create');
    Route::post('/expenses', [\App\Http\Controllers\ExpenseController::class, 'store'])->name('expenses.store');
});

require __DIR__.'/auth.php';
