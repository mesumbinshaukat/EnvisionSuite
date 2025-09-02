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
}
