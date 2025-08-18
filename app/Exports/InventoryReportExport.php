<?php
namespace App\Exports;

use App\Models\Product;
use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\WithHeadings;

class InventoryReportExport implements FromArray, WithHeadings
{
    public function __construct(
        protected ?int $shopId,
    ) {}

    public function array(): array
    {
        $rows = [];
        $query = Product::query()->when($this->shopId, fn($q) => $q->where('shop_id', $this->shopId));
        foreach ($query->get(['id','name','sku','price','stock','tax_rate','is_active']) as $p) {
            $rows[] = [
                $p->id,
                $p->name,
                $p->sku,
                (string)$p->price,
                (int)$p->stock,
                (string)$p->tax_rate,
                $p->is_active ? 'Yes' : 'No',
            ];
        }
        return $rows;
    }

    public function headings(): array
    {
        return ['Product ID','Name','SKU','Price','Stock','Tax Rate','Active'];
    }
}
