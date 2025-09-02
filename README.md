# EnvisionSuite: Unified POS + Ledger Dashboard

EnvisionSuite is a unified Laravel + React + Inertia application that merges POS features (inspired by NexoPOS) with full accounting/ledger capabilities (via the abivia/ledger package). It includes RBAC, multi-shop support, inventory tracking, Excel exports, and responsive charts.

## Tech Stack
- Laravel 12, PHP 8+
- MySQL (DB: `envision_product`)
- React + Inertia + Tailwind CSS (Breeze)
- Spatie Laravel Permission (RBAC)
- Maatwebsite Excel (XLSX export)
- Chart.js + react-chartjs-2 (charts)
- abivia/ledger (double-entry ledger)

## Quick Start
1) Configure `.env` (already set in this project):
   - DB: host `localhost`, database `envision_product`, user `root`, password empty
2) Install backend deps (already installed):
   - `composer install`
3) Install frontend deps (already installed):
   - `npm install`
4) Run migrations and seeds:
   - `php artisan migrate`
   - `php artisan db:seed` (creates roles, a default superadmin, default shop, sample data)
5) Build assets or run dev:
   - `npm run build` (production) or `npm run dev`
6) Serve the app:
   - `php artisan serve --port=8000` and open http://127.0.0.1:8000

Default superadmin:
- Email: `admin@example.com`
- Password: `password`

## Core Features
- Products, Customers, Sales, POS checkout
- Multi-shop support (shop switching, shop-scoped data)
- Inventory management with stock movements (sale, adjustment, transfer, return)
- Reporting (Sales, Inventory) with filters, charts, and Excel export
- Ledger snapshot and integration hooks (abivia/ledger)
- RBAC roles: superadmin, admin, cashier, accountant

## Roles & Access
- superadmin: full access
- admin: manage shops, inventory, reports
- cashier: POS and sales
- accountant: reports and ledger

Spatie middleware registered in `bootstrap/app.php`:
- `role`, `permission`, `role_or_permission`

## Multi-Shop
- Middleware `app/Http/Middleware/SetCurrentShop.php` sets session `shop_id` and shares it to Inertia.
- Visit `Shops` page (`/shops`) to switch the active shop. Routes are role-guarded (`admin|superadmin`).
- Models with `shop_id`: `Product`, `Customer`, `Sale`, `SaleItem`, `StockMovement`.

## Inventory
- Table: `stock_movements` with `type` in [sale, adjustment, transfer_in, transfer_out, return].
- Sales automatically decrement product stock and record a `StockMovement`.
- Manual adjustments: `Inventory -> Adjustments` pages.

## Reporting
- Sales Report: `/reports/sales` (date filters, chart, export XLSX)
- Inventory Report: `/reports/inventory` (stock chart, recent movements, export XLSX)
- Exports: `app/Exports/SalesReportExport.php`, `app/Exports/InventoryReportExport.php`

## Key Back-end Files
- Controllers:
  - `app/Http/Controllers/ShopController.php`
  - `app/Http/Controllers/ReportingController.php`
  - `app/Http/Controllers/StockMovementController.php`
  - `app/Http/Controllers/ProductController.php`, `CustomerController.php`, `SaleController.php`, `POSController.php`, `LedgerController.php`
- Models:
  - `app/Models/Shop.php`, `StockMovement.php`, `Product.php`, `Customer.php`, `Sale.php`, `SaleItem.php`
- Middleware:
  - `app/Http/Middleware/SetCurrentShop.php`
- Routes:
  - `routes/web.php` (role-guarded shops, reports, inventory routes)
- Migrations:
  - `database/migrations/2025_08_13_140000_create_shops_table.php`
  - `database/migrations/2025_08_13_140100_add_shop_id_to_core_tables.php`
  - `database/migrations/2025_08_13_140200_create_stock_movements_table.php`
- Seeders:
  - `database/seeders/DatabaseSeeder.php` (roles, superadmin, default shop)
  - `database/seeders/SampleDataSeeder.php` (sample products/customers/sales)

## Front-end Pages
- Shops: `resources/js/Pages/Shops/Index.jsx`
- Reports: `resources/js/Pages/Reports/Sales.jsx`, `resources/js/Pages/Reports/Inventory.jsx`
- Inventory Adjustments: `resources/js/Pages/Inventory/Adjustments/{Index,Create}.jsx`
- Navigation: `resources/js/Layouts/AuthenticatedLayout.jsx` (links for Shops, Reports, Inventory)

## Usage Guide
1) Login using superadmin credentials.
2) Optionally switch shop in `Shops`.
3) Manage catalog in `Products` and `Customers`.
4) Perform sales via `POS` or `Sales -> Create`.
5) Review `Dashboard`, `Reports -> Sales/Inventory`, and export to Excel.
6) Make inventory adjustments via `Inventory -> Adjustments`.

## Ledger Integration
- `LedgerController` exposes balances and recent entries. Extend by posting journal entries during sales or adjustments if deeper accounting is required.
- abivia/ledger is installed and can be configured for full double-entry flows.

## Troubleshooting
- Missing roles/migrations: run `php artisan migrate` and `php artisan db:seed`.
- Assets not updating: run `npm run build` (or `npm run dev`).
- Permission errors: ensure user has appropriate role; see `DatabaseSeeder` for default roles.

## Security & Production
- Ensure `.env` is configured for production DB and mail.
- Run `php artisan config:cache` and `php artisan route:cache` after deployment.
- Use HTTPS and set `APP_ENV=production`, `APP_DEBUG=false`.
