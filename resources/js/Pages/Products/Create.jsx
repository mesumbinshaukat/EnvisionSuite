import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, Link, useForm } from '@inertiajs/react';

export default function Create({ categories = [] }) {
  const { data, setData, post, processing, errors } = useForm({
    name: '',
    sku: '',
    description: '',
    price: '',
    stock: '',
    tax_rate: '0',
    is_active: true,
    category_id: '',
  });

  const submit = (e) => { e.preventDefault(); post(route('products.store')); };

  return (
    <AuthenticatedLayout header={<h2 className="text-xl font-semibold">New Product</h2>}>
      <Head title="New Product" />
      <div className="mx-auto max-w-3xl p-6">
        <form onSubmit={submit} className="space-y-4 bg-white shadow-sm rounded-lg p-6">
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-sm text-blue-800">Fields marked with * are required.</p>
          </div>

          {/* Product Name */}
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Product Name *
            </label>
            <input
              id="name"
              type="text"
              required
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.name ? 'border-red-500' : 'border-gray-300'
              }`}
              value={data.name}
              onChange={(e) => setData('name', e.target.value)}
              placeholder="Enter product name"
            />
            {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
          </div>

          {/* SKU */}
          <div>
            <label htmlFor="sku" className="block text-sm font-medium text-gray-700 mb-1">
              SKU *
            </label>
            <input
              id="sku"
              type="text"
              required
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.sku ? 'border-red-500' : 'border-gray-300'
              }`}
              value={data.sku}
              onChange={(e) => setData('sku', e.target.value)}
              placeholder="Enter SKU code"
            />
            {errors.sku && <p className="mt-1 text-sm text-red-600">{errors.sku}</p>}
        </div>

          {/* Description */}
            <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              id="description"
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={data.description}
              onChange={(e) => setData('description', e.target.value)}
              placeholder="Enter product description (optional)"
            />
            {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
            </div>

          {/* Price */}
              <div>
            <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
              Price *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-gray-500">Rs</span>
              <input
                id="price"
                type="number"
                required
                step="0.01"
                min="0"
                className={`w-full pl-8 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.price ? 'border-red-500' : 'border-gray-300'
                }`}
                value={data.price}
                onChange={(e) => setData('price', e.target.value)}
                placeholder="0.00"
              />
            </div>
            {errors.price && <p className="mt-1 text-sm text-red-600">{errors.price}</p>}
          </div>

          {/* Stock */}
            <div>
            <label htmlFor="stock" className="block text-sm font-medium text-gray-700 mb-1">
              Stock Quantity *
            </label>
            <input
              id="stock"
              type="number"
              required
              min="0"
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.stock ? 'border-red-500' : 'border-gray-300'
              }`}
              value={data.stock}
              onChange={(e) => setData('stock', e.target.value)}
              placeholder="0"
            />
            {errors.stock && <p className="mt-1 text-sm text-red-600">{errors.stock}</p>}
          </div>

          {/* Tax Rate */}
            <div>
            <label htmlFor="tax_rate" className="block text-sm font-medium text-gray-700 mb-1">
              Tax Rate (%)
            </label>
            <input
              id="tax_rate"
              type="number"
              step="0.01"
              min="0"
              max="100"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={data.tax_rate}
              onChange={(e) => setData('tax_rate', e.target.value)}
              placeholder="0.00"
            />
            <p className="mt-1 text-sm text-gray-500">Enter 0 if no tax applies</p>
            {errors.tax_rate && <p className="mt-1 text-sm text-red-600">{errors.tax_rate}</p>}
          </div>

          {/* Category */}
          <div>
            <label htmlFor="category_id" className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              id="category_id"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={data.category_id}
              onChange={(e) => setData('category_id', e.target.value)}
            >
              <option value="">Select a category (optional)</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            {errors.category_id && <p className="mt-1 text-sm text-red-600">{errors.category_id}</p>}
          </div>

          {/* Active Status */}
          <div className="flex items-center">
            <input
              id="is_active"
              type="checkbox"
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              checked={data.is_active}
              onChange={(e) => setData('is_active', e.target.checked)}
            />
            <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
              Product is active
            </label>
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end space-x-3 pt-4">
            <Link
              href={route('products.index')}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={processing}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {processing ? 'Creating...' : 'Create Product'}
            </button>
          </div>
        </form>
      </div>
    </AuthenticatedLayout>
  );
}
