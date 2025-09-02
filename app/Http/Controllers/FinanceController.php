<?php
namespace App\Http\Controllers;

use App\Models\Shop;
use App\Models\VendorPayment;
use App\Services\LedgerService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class FinanceController extends Controller
{
    public function summary(Request $request)
    {
        $shopId = session('shop_id') ?: optional(Shop::first())->id;
        $from = $request->query('from');
        $to = $request->query('to');

        $ledger = app(LedgerService::class);
        $cash = $ledger->getAccountBalanceByCode('1000', $shopId);
        $bank = $ledger->getAccountBalanceByCode('1010', $shopId);

        $paymentsQ = VendorPayment::query()
            ->when($shopId, fn($q) => $q->where('shop_id', $shopId))
            ->when($from, fn($q) => $q->whereDate('date', '>=', $from))
            ->when($to, fn($q) => $q->whereDate('date', '<=', $to));

        $byMethod = (clone $paymentsQ)
            ->selectRaw('payment_method, COUNT(*) as count, SUM(amount) as total')
            ->groupBy('payment_method')
            ->get()
            ->map(fn($r) => [
                'method' => $r->payment_method,
                'count' => (int) $r->count,
                'total' => (float) $r->total,
            ]);

        $totalPaid = (float) (clone $paymentsQ)->sum('amount');

        return Inertia::render('Finance/Summary', [
            'filters' => [ 'from' => $from, 'to' => $to ],
            'balances' => [ 'cash' => $cash, 'bank' => $bank, 'total' => round($cash + $bank, 2) ],
            'vendorPayments' => [ 'total' => $totalPaid, 'byMethod' => $byMethod ],
        ]);
    }
}
