<?php
namespace App\Exports;

use App\Models\Sale;
use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\WithHeadings;

class SalesReportExport implements FromArray, WithHeadings
{
    public function __construct(
        protected string $from,
        protected string $to,
        protected ?int $shopId,
    ) {}

    public function array(): array
    {
        $rows = [];
        $query = Sale::query()
            ->when($this->shopId, fn($q) => $q->where('shop_id', $this->shopId))
            ->whereBetween('created_at', ["{$this->from} 00:00:00", "{$this->to} 23:59:59"])
            ->orderBy('created_at');

        foreach ($query->get(['id','customer_id','subtotal','discount','tax','total','payment_method','created_at']) as $sale) {
            $rows[] = [
                $sale->id,
                $sale->customer_id,
                (string)$sale->subtotal,
                (string)$sale->discount,
                (string)$sale->tax,
                (string)$sale->total,
                $sale->payment_method,
                $sale->created_at->toDateTimeString(),
            ];
        }
        return $rows;
    }

    public function headings(): array
    {
        return ['Sale ID','Customer ID','Subtotal','Discount','Tax','Total','Payment Method','Date'];
    }
}
