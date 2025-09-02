<?php
namespace App\Http\Controllers;

use App\Models\VendorPayment;
use App\Models\Vendor;
use App\Models\Shop;
use App\Services\LedgerService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class VendorPaymentController extends Controller
{
    public function index(Request $request)
    {
        $shopId = session('shop_id') ?: optional(Shop::first())->id;
        $payments = VendorPayment::with('vendor')
            ->when($shopId, fn($q) => $q->where('shop_id', $shopId))
            ->orderByDesc('date')
            ->paginate(15)
            ->withQueryString();
        return Inertia::render('VendorPayments/Index', [ 'payments' => $payments ]);
    }

    public function create()
    {
        $shopId = session('shop_id') ?: optional(Shop::first())->id;
        return Inertia::render('VendorPayments/Create', [
            'vendors' => Vendor::when($shopId, fn($q)=>$q->where('shop_id',$shopId))->orderBy('name')->get(['id','name']),
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'vendor_id' => ['required','exists:vendors,id'],
            'date' => ['required','date'],
            'amount' => ['required','numeric','min:0.01'],
            'payment_method' => ['required','in:cash,bank_transfer,card'],
            'notes' => ['nullable','string','max:255'],
        ]);

        $shopId = session('shop_id') ?: optional(Shop::first())->id;
        $userId = Auth::id();

        // Enforce sufficient funds based on payment method
        $method = strtolower($data['payment_method']);
        $accountCode = in_array($method, ['card','bank','mobile','wallet','bank_transfer']) ? '1010' : '1000';
        $available = app(LedgerService::class)->getAccountBalanceByCode($accountCode, $shopId);
        if ((float)$data['amount'] > $available) {
            $label = $accountCode === '1010' ? 'bank' : 'cash';
            return back()->withErrors(['amount' => 'Insufficient '.$label.' balance ('.$accountCode.'). Available: Rs '.number_format($available, 2)])->withInput();
        }

        return DB::transaction(function () use ($data, $shopId, $userId) {
            $payment = VendorPayment::create([
                'shop_id' => $shopId,
                'user_id' => $userId,
                'vendor_id' => $data['vendor_id'],
                'date' => $data['date'],
                'amount' => $data['amount'],
                'payment_method' => $data['payment_method'],
                'notes' => $data['notes'] ?? null,
            ]);

            app(LedgerService::class)->postVendorPayment((float)$data['amount'], $data['payment_method'], $shopId, $userId, $payment->id, 'Vendor payment #'.$payment->id);

            // Adjust vendor running balance: balance += amount
            // Rationale: purchases set balance += (paid - grand). Payables are negative.
            // A vendor payment increases balance towards zero (reducing payable) or increases advance if overpaid.
            $vendor = Vendor::lockForUpdate()->find($data['vendor_id']);
            if ($vendor) {
                $current = (float) ($vendor->balance ?? 0);
                $vendor->balance = round($current + (float)$data['amount'], 2);
                $vendor->save();
            }

            return redirect()->route('vendor-payments.index')->with('success', 'Vendor payment recorded.');
        });
    }
}
