<?php
namespace App\Http\Controllers;

use App\Models\CustomerReceipt;
use App\Models\Customer;
use App\Models\Shop;
use App\Services\LedgerService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class CustomerReceiptController extends Controller
{
    public function index(Request $request)
    {
        $shopId = session('shop_id') ?: optional(Shop::first())->id;
        $receipts = CustomerReceipt::with('customer')
            ->when($shopId, fn($q) => $q->where('shop_id', $shopId))
            ->orderByDesc('date')
            ->paginate(15)
            ->withQueryString();
        return Inertia::render('CustomerReceipts/Index', [ 'receipts' => $receipts ]);
    }

    public function create()
    {
        $shopId = session('shop_id') ?: optional(Shop::first())->id;
        return Inertia::render('CustomerReceipts/Create', [
            'customers' => Customer::when($shopId, fn($q)=>$q->where('shop_id',$shopId))->orderBy('name')->get(['id','name']),
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'customer_id' => ['required','exists:customers,id'],
            'date' => ['required','date'],
            'amount' => ['required','numeric','min:0.01'],
            'payment_method' => ['required','in:cash,bank_transfer,card'],
            'notes' => ['nullable','string','max:255'],
        ]);

        $shopId = session('shop_id') ?: optional(Shop::first())->id;
        $userId = Auth::id();

        return DB::transaction(function () use ($data, $shopId, $userId) {
            $receipt = CustomerReceipt::create([
                'shop_id' => $shopId,
                'user_id' => $userId,
                'customer_id' => $data['customer_id'],
                'date' => $data['date'],
                'amount' => $data['amount'],
                'payment_method' => $data['payment_method'],
                'notes' => $data['notes'] ?? null,
            ]);

            app(LedgerService::class)->postCustomerReceipt((float)$data['amount'], $data['payment_method'], $shopId, $userId, $receipt->id, 'Customer receipt #'.$receipt->id);

            return redirect()->route('customer-receipts.index')->with('success', 'Customer receipt recorded.');
        });
    }

    /**
     * Maintenance: Backfill CustomerReceipt records for past sales that had upfront payments
     * but no corresponding receipt record. This does NOT post ledger entries to avoid double-posting.
     */
    public function backfillFromSales(Request $request)
    {
        $shopId = session('shop_id') ?: optional(Shop::first())->id;
        $userId = Auth::id();

        $limit = (int) ($request->input('limit') ?? 500);

        $sales = \App\Models\Sale::query()
            ->when($shopId, fn($q) => $q->where('shop_id', $shopId))
            ->whereNotNull('customer_id')
            ->where('amount_paid', '>', 0)
            ->orderBy('id')
            ->limit($limit)
            ->get(['id','shop_id','user_id','customer_id','amount_paid','payment_method','created_at']);

        $created = 0; $skipped = 0;
        foreach ($sales as $sale) {
            $note1 = 'Auto-recorded from Sale #'.$sale->id;
            $note2 = 'Auto-backfilled from Sale #'.$sale->id;
            $exists = CustomerReceipt::where('customer_id', $sale->customer_id)
                ->where('shop_id', $sale->shop_id)
                ->whereIn('notes', [$note1, $note2])
                ->exists();
            if ($exists) { $skipped++; continue; }

            // Normalize payment method to allowed set if needed
            $pm = $sale->payment_method ?: 'cash';
            if (!in_array($pm, ['cash','bank_transfer','card'])) { $pm = 'cash'; }

            CustomerReceipt::create([
                'shop_id' => $sale->shop_id,
                'user_id' => $sale->user_id ?: $userId,
                'customer_id' => $sale->customer_id,
                'date' => optional($sale->created_at)->toDateString() ?? now()->toDateString(),
                'amount' => (float)$sale->amount_paid,
                'payment_method' => $pm,
                'notes' => $note2,
            ]);
            $created++;
        }

        return redirect()->back()->with('success', "Backfill complete. Created: {$created}, Skipped: {$skipped}");
    }
}
