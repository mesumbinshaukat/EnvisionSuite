import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, router, usePage } from '@inertiajs/react';
import { useState } from 'react';
import FmtCurrency from '@/Components/FmtCurrency';
import Tooltip from '@/Components/Tooltip';
import { useI18n } from '@/i18n';

export default function Index({ products }) {
  const [searchTerm, setSearchTerm] = useState('');
  const { props } = usePage();
  const { t } = useI18n();

  const filteredProducts = products.data.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <AuthenticatedLayout header={<h2 className="text-xl font-semibold">{t('products')}</h2>}>
      <Head title={t('products')} />
      
      <div className="mx-auto max-w-7xl p-6">
        <div className="flex justify-between items-center mb-6">
          <div className="flex-1 max-w-md">
            <input
              type="text"
              placeholder={t('search_products') || 'Search products...'}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex space-x-3">
            <Link
              href={route('products.create')}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors"
            >
              {t('new_product')}
            </Link>
            <Link
              href={route('pricing.index')}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md transition-colors"
            >
              {t('product_pricing')}
            </Link>
          </div>
        </div>

        {props.flash?.error && (
          <div className="mb-4 rounded border border-red-200 bg-red-50 px-4 py-2 text-red-700">{props.flash.error}</div>
        )}
        {props.flash?.success && (
          <div className="mb-4 rounded border border-green-200 bg-green-50 px-4 py-2 text-green-700">{props.flash.success}</div>
        )}

        <div className="bg-white shadow-sm rounded-lg">
          <div className="overflow-x-auto">
            <table className="min-w-[1100px] w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('product')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('sku')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('selling_price_per_unit')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('stock')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('purchasing_cost_per_unit_avg')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('avg_selling_price')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('old_qty')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('new_qty')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('current_qty')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('status_label')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {t('actions')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredProducts.map((product) => (
                <tr key={product.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{product.name}</div>
                      {product.description && (
                        <div className="text-sm text-gray-500">{product.description}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {product.sku}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <FmtCurrency value={product.price || 0} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {product.stock}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {product.avg_purchase_cost != null ? <FmtCurrency value={product.avg_purchase_cost} /> : '—'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {product.avg_selling_price != null ? <FmtCurrency value={product.avg_selling_price} /> : '—'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {product.last_purchase_old_qty ?? '—'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {product.last_purchase_new_qty ?? '—'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {product.stock}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      product.is_active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {product.is_active ? t('active') : t('inactive')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <Link
                      href={route('products.show', product.id)}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                    >
                      <Tooltip text={t('view_product_tip') || t('view')}>{t('view')}</Tooltip>
                    </Link>
                    <Link
                      href={route('products.edit', product.id)}
                      className="text-indigo-600 hover:text-indigo-900 mr-3"
                    >
                      <Tooltip text={t('edit_product_tip') || t('edit')}>{t('edit')}</Tooltip>
                    </Link>
                    {(() => {
                      const canDelete = (product.can_delete !== false) && (product.stock == null || Number(product.stock) <= 0);
                      const reason = product.stock && Number(product.stock) > 0
                        ? t('cannot_delete_due_to_stock')
                        : (product.can_delete === false ? (t('cannot_delete_due_to_links') || t('cannot_delete')) : '');
                      return canDelete ? (
                        <button
                          onClick={() => {
                            if (confirm(t('confirm_delete_product') || 'Delete this product? This action cannot be undone.')) {
                              router.delete(route('products.destroy', product.id));
                            }
                          }}
                          className="text-red-600 hover:text-red-800"
                        >
                          {t('delete')}
                        </button>
                      ) : (
                        <span className="text-gray-400 cursor-not-allowed">
                          <Tooltip text={reason || (t('delete_disabled') || 'Delete disabled')}>{t('delete')}</Tooltip>
                        </span>
                      );
                    })()}
                  </td>
                </tr>
              ))}
            </tbody>
            </table>
          </div>
        </div>

        {products.links && (
          <div className="mt-6">
            {/* Pagination links would go here */}
          </div>
        )}
      </div>
    </AuthenticatedLayout>
  );
}
