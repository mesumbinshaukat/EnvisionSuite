import React from 'react';
import { router } from '@inertiajs/react';

export default function ShopSelector({ shops, currentShop, className = '' }) {
    const handleShopChange = (shopId) => {
        router.post(`/shops/switch/${shopId}`, {}, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    if (!shops || shops.length <= 1) {
        return null;
    }

    return (
        <div className={`flex items-center space-x-2 ${className}`}>
            <label htmlFor="shop-selector" className="text-sm font-medium text-gray-700">
                Shop:
            </label>
            <select
                id="shop-selector"
                value={currentShop?.id || ''}
                onChange={(e) => handleShopChange(e.target.value)}
                className="block w-48 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            >
                {shops.map((shop) => (
                    <option key={shop.id} value={shop.id}>
                        {shop.name} ({shop.code})
                    </option>
                ))}
            </select>
        </div>
    );
}
