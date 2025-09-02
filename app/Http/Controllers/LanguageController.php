<?php

namespace App\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class LanguageController extends Controller
{
    /**
     * Persist selected locale in session and redirect back.
     */
    public function switch(Request $request, string $locale): RedirectResponse
    {
        $locale = in_array($locale, ['en', 'ur']) ? $locale : 'en';
        $request->session()->put('locale', $locale);
        return back();
    }
}
