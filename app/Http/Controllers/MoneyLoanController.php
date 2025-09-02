<?php

namespace App\Http\Controllers;

use App\Models\MoneyLoan;
use App\Models\Shop;
use App\Models\Vendor;
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
        return Inertia::render('MoneyLoans/Index', [ 'loans' => $loans ]);
    }

    public function create()
    {
        $shopId = session('shop_id') ?: optional(Shop::first())->id;
        $vendors = Vendor::when($shopId, fn($q)=>$q->where('shop_id',$shopId))
            ->orderBy('name')->get(['id','name']);
        return Inertia::render('MoneyLoans/Create', [ 'vendors' => $vendors ]);
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
        ]);

        $shopId = session('shop_id') ?: optional(Shop::first())->id;

        return DB::transaction(function () use ($data, $shopId, $ledger) {
            $amount = (float) $data['amount'];
            $sourceCode = $data['source'] === 'bank' ? '1010' : '1000';
            if ($data['direction'] === 'lend') {
                // Ensure sufficient funds in cash/bank when lending
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

            // Post to ledger
            $ledger->postMoneyLoan($loan);

            return redirect()->route('money.loans.index')->with('success', 'Money loan recorded.');
        });
    }
}
