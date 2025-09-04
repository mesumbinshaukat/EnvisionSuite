<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\Shop;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class CategoryController extends Controller
{
    public function index()
    {
        $user = Auth::user();
        $isSuper = $user && method_exists($user, 'hasRole') ? $user->hasRole('superadmin') : false;
        $shopId = session('shop_id') ?: optional(Shop::first())->id;
        $categories = Category::query()
            ->when($shopId, fn($q) => $q->where('shop_id', $shopId))
            ->when(!$isSuper, fn($q) => $q->where('user_id', $user->id))
            ->orderBy('name')
            ->paginate(12)
            ->withQueryString();
        return Inertia::render('Categories/Index', [ 'categories' => $categories ]);
    }

    public function create()
    {
        return Inertia::render('Categories/Create');
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => ['required','string','max:255'],
            'type' => ['nullable','string','max:100'],
            'description' => ['nullable','string'],
        ]);
        $data['shop_id'] = session('shop_id') ?: optional(Shop::first())->id;
        $data['user_id'] = Auth::id();
        Category::create($data);
        return redirect()->route('categories.index')->with('success', 'Category created');
    }

    public function edit(string $id)
    {
        $user = Auth::user();
        $isSuper = $user && method_exists($user, 'hasRole') ? $user->hasRole('superadmin') : false;
        $category = Category::when(!$isSuper, fn($q) => $q->where('user_id', $user->id))->findOrFail($id);
        return Inertia::render('Categories/Edit', [ 'category' => $category ]);
    }

    public function update(Request $request, string $id)
    {
        $user = Auth::user();
        $isSuper = $user && method_exists($user, 'hasRole') ? $user->hasRole('superadmin') : false;
        $category = Category::when(!$isSuper, fn($q) => $q->where('user_id', $user->id))->findOrFail($id);
        $data = $request->validate([
            'name' => ['required','string','max:255'],
            'type' => ['nullable','string','max:100'],
            'description' => ['nullable','string'],
        ]);
        $data['shop_id'] = $category->shop_id ?: (session('shop_id') ?: optional(Shop::first())->id);
        $category->update($data);
        return redirect()->route('categories.index')->with('success', 'Category updated');
    }

    public function destroy(string $id)
    {
        $user = Auth::user();
        $isSuper = $user && method_exists($user, 'hasRole') ? $user->hasRole('superadmin') : false;
        $category = Category::when(!$isSuper, fn($q) => $q->where('user_id', $user->id))->findOrFail($id);
        $category->delete();
        return redirect()->route('categories.index')->with('success', 'Category deleted');
    }
}
