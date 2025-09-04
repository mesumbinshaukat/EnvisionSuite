<?php

namespace App\Http\Controllers;

use App\Models\MoneyLoan;
use App\Models\Shop;
use App\Models\Vendor;
use App\Models\Purchase;
use App\Services\LedgerService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class MoneyLoanController extends Controller
{
    public function index()
    {
        $shopId = session('shop_id') ?: optional(Shop::first())->id;
        $loans = MoneyLoan::with(['vendor','shop'])
            ->when($shopId, fn($q) => $q->where('shop_id', $shopId))
            ->orderByDesc('id')
            ->paginate(15)
            ->withQueryString();
        return Inertia::render('Transactions/Index', [ 'loans' => $loans ]);
    }

    public function create()
    {
        $shopId = session('shop_id') ?: optional(Shop::first())->id;
        $vendors = Vendor::when($shopId, fn($q)=>$q->where('shop_id',$shopId))
            ->orderBy('name')->get(['id','name']);
        // Compute pending vendor debts (sum of unpaid amounts on purchases)
        $debts = Purchase::query()
            ->when($shopId, fn($q)=>$q->where('shop_id', $shopId))
            ->whereIn('status', ['open','partial','unpaid'])
            ->selectRaw('vendor_id, SUM(GREATEST(grand_total - COALESCE(amount_paid,0), 0)) as unpaid')
            ->groupBy('vendor_id')
            ->pluck('unpaid','vendor_id');

        $ledger = app(LedgerService::class);
        $cashBal = (float) $ledger->getAccountBalanceByCode('1000', $shopId);
        $bankBal = (float) $ledger->getAccountBalanceByCode('1010', $shopId);

        return Inertia::render('Transactions/Create', [
            'vendors' => $vendors,
            'vendorDebts' => $debts,
            'balances' => [ 'cash' => $cashBal, 'bank' => $bankBal ],
        ]);
    }

    public function store(Request $request, LedgerService $ledger)
    {
        $data = $request->validate([
            'counterparty_type' => 'required|in:vendor,external',
            'vendor_id' => 'nullable|exists:vendors,id',
            'counterparty_name' => 'nullable|string|max:255',
            'direction' => 'required|in:lend,borrow',
            'source' => 'required|in:cash,bank',
            'amount' => 'required|numeric|min:0.01',
            'date' => 'nullable|date',
            'note' => 'nullable|string',
            'purpose' => 'nullable|in:general,vendor_payoff',
        ]);

        $shopId = session('shop_id') ?: optional(Shop::first())->id;

        return DB::transaction(function () use ($data, $shopId, $ledger) {
            $amount = (float) $data['amount'];
            $sourceCode = $data['source'] === 'bank' ? '1010' : '1000';
            $purpose = $data['purpose'] ?? 'general';

            // If cash will go out (lend or vendor payoff), ensure sufficient funds in source
            if ($data['direction'] === 'lend' || $purpose === 'vendor_payoff') {
                $ledger->assertSufficientFundsByCode($sourceCode, $amount, $shopId);
            }

            $loan = MoneyLoan::create([
                'shop_id' => $shopId,
                'counterparty_type' => $data['counterparty_type'],
                'vendor_id' => $data['counterparty_type'] === 'vendor' ? ($data['vendor_id'] ?? null) : null,
                'counterparty_name' => $data['counterparty_type'] === 'external' ? ($data['counterparty_name'] ?? null) : null,
                'direction' => $data['direction'],
                'source' => $data['source'],
                'amount' => $amount,
                'date' => $data['date'] ?? now()->toDateString(),
                'note' => $data['note'] ?? null,
                'user_id' => Auth::id(),
            ]);

            // Default posting: record the loan
            $ledger->postMoneyLoan($loan);

            // Optional purpose: pay off vendor debt immediately
            if ($purpose === 'vendor_payoff') {
                // Validate vendor context
                if (($data['counterparty_type'] ?? null) !== 'vendor' || empty($data['vendor_id'])) {
                    abort(422, 'Vendor is required when purpose is vendor payoff.');
                }

                // Compute pending debt for vendor
                $pending = (float) Purchase::query()
                    ->when($shopId, fn($q)=>$q->where('shop_id', $shopId))
                    ->where('vendor_id', $data['vendor_id'])
                    ->whereIn('status', ['open','partial','unpaid'])
                    ->selectRaw('SUM(GREATEST(grand_total - COALESCE(amount_paid,0), 0)) as unpaid')
                    ->value('unpaid');
                $pending = round($pending ?? 0.0, 2);
                if ($pending <= 0) {
                    abort(422, 'Selected vendor has no pending debt to pay off.');
                }
                if ($amount > $pending + 0.0001) {
                    abort(422, 'Amount exceeds vendor\'s pending debt ('.number_format($pending,2).').');
                }

                // Post vendor payment via ledger (Dr AP 2100, Cr cash/bank)
                $method = $data['source'] === 'bank' ? 'bank' : 'cash';
                $ledger->postVendorPayment($amount, $method, $shopId, Auth::id(), $loan->id, 'Vendor payoff via money loan');

                // Update vendor balance tracking
                if (!empty($data['vendor_id'])) {
                    $vendor = Vendor::lockForUpdate()->find($data['vendor_id']);
                    if ($vendor) {
                        // In our convention, balance += (amount_paid - grand_total). Paying vendor increases balance (less negative / more positive)
                        $current = (float) ($vendor->balance ?? 0);
                        $vendor->balance = round($current + $amount, 2);
                        $vendor->save();
                    }
                }

                // Apportion payment to oldest unpaid purchases for this vendor (FIFO)
                $remaining = $amount;
                if ($remaining > 0) {
                    $purchases = Purchase::query()
                        ->lockForUpdate()
                        ->when($shopId, fn($q)=>$q->where('shop_id', $shopId))
                        ->where('vendor_id', $data['vendor_id'])
                        ->whereIn('status', ['open','partial','unpaid'])
                        ->orderBy('id')
                        ->get(['id','grand_total','amount_paid','status']);

                    foreach ($purchases as $p) {
                        $paid = (float) ($p->amount_paid ?? 0);
                        $grand = (float) ($p->grand_total ?? 0);
                        $due = max($grand - $paid, 0);
                        if ($due <= 0) { continue; }

                        $apply = min($due, $remaining);
                        if ($apply <= 0) { break; }

                        $p->amount_paid = round($paid + $apply, 2);
                        if ($p->amount_paid + 0.0001 >= $grand) {
                            $p->status = 'paid';
                        } elseif ($p->amount_paid > 0) {
                            $p->status = 'partial';
                        } else {
                            $p->status = 'unpaid';
                        }
                        $p->save();

                        $remaining = round($remaining - $apply, 2);
                        if ($remaining <= 0.0001) { break; }
                    }
                }
            }

            return redirect()->route('transactions.index')->with('success', 'Transaction recorded.');
        });
    }
}
