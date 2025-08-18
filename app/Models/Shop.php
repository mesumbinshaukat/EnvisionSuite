<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Shop extends Model
{
    use HasFactory;

    protected $fillable = ['name','code','currency','is_active','location','user_id'];

    public function products() { return $this->hasMany(Product::class); }
    public function customers() { return $this->hasMany(Customer::class); }
    public function sales() { return $this->hasMany(Sale::class); }
}
