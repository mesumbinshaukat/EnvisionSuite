<?php

namespace App\Exports;

use App\Models\Purchase;
use App\Models\Shop;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithTitle;
use Carbon\Carbon;

class PurchasesReportExport implements FromCollection, WithHeadings, WithTitle
{
    protected int|null $shopId;
    protected Carbon $startDate;
    protected $vendorId;
    protected $productId;
    protected $status;

    public function __construct(?int $shopId, Carbon $startDate, $vendorId = null, $productId = null, $status = null)
    {
        $this->shopId = $shopId;
        $this->startDate = $startDate;
        $this->vendorId = $vendorId;
        $this->productId = $productId;
        $this->status = $status;
    }

    public function title(): string
    {
        return 'Detailed Purchases';
    }

    public function headings(): array
    {
        return [
            'ID', 'Date/Time', 'Vendor', 'Items', 'Units', 'Subtotal', 'Tax', 'Other', 'Total', 'Paid', 'Status',
        ];
    }

    public function collection()
    {
        $query = Purchase::query()
            ->with('vendor','items')
            ->when($this->shopId, fn($q) => $q->where('shop_id', $this->shopId))
            ->when($this->vendorId, fn($q) => $q->where('vendor_id', $this->vendorId))
            ->when($this->status, fn($q) => $q->where('status', $this->status))
            ->when($this->productId, fn($q) => $q->whereHas('items', fn($qq) => $qq->where('product_id', $this->productId)))
            ->where('created_at', '>=', $this->startDate)
            ->orderBy('id');

        $rows = new Collection();
        foreach ($query->cursor() as $p) {
            $units = (int) $p->items->sum('quantity');
            $rows->push([
                $p->id,
                optional($p->created_at)->toDateTimeString(),
                $p->vendor->name ?? ($p->vendor_name ?? 'Unknown'),
                (int) $p->items->count(),
                $units,
                (float) $p->subtotal,
                (float) ($p->tax_total ?? 0),
                (float) ($p->other_charges ?? 0),
                (float) $p->grand_total,
                (float) ($p->amount_paid ?? 0),
                $p->status ?? null,
            ]);
        }
        return $rows;
    }
}
