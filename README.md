<p align="center"><a href="https://laravel.com" target="_blank"><img src="https://raw.githubusercontent.com/laravel/art/master/logo-lockup/5%20SVG/2%20CMYK/1%20Full%20Color/laravel-logolockup-cmyk-red.svg" width="400" alt="Laravel Logo"></a></p>

<p align="center">
<a href="https://github.com/laravel/framework/actions"><img src="https://github.com/laravel/framework/workflows/tests/badge.svg" alt="Build Status"></a>
<a href="https://packagist.org/packages/laravel/framework"><img src="https://img.shields.io/packagist/dt/laravel/framework" alt="Total Downloads"></a>
<a href="https://packagist.org/packages/laravel/framework"><img src="https://img.shields.io/packagist/v/laravel/framework" alt="Latest Stable Version"></a>
<a href="https://packagist.org/packages/laravel/framework"><img src="https://img.shields.io/packagist/l/laravel/framework" alt="License"></a>
</p>

## About Laravel

Laravel is a web application framework with expressive, elegant syntax. We believe development must be an enjoyable and creative experience to be truly fulfilling. Laravel takes the pain out of development by easing common tasks used in many web projects, such as:

- [Simple, fast routing engine](https://laravel.com/docs/routing).
- [Powerful dependency injection container](https://laravel.com/docs/container).
- Multiple back-ends for [session](https://laravel.com/docs/session) and [cache](https://laravel.com/docs/cache) storage.
- Expressive, intuitive [database ORM](https://laravel.com/docs/eloquent).
- Database agnostic [schema migrations](https://laravel.com/docs/migrations).
- [Robust background job processing](https://laravel.com/docs/queues).
- [Real-time event broadcasting](https://laravel.com/docs/broadcasting).

Laravel is accessible, powerful, and provides tools required for large, robust applications.

## Learning Laravel

Laravel has the most extensive and thorough [documentation](https://laravel.com/docs) and video tutorial library of all modern web application frameworks, making it a breeze to get started with the framework.

You may also try the [Laravel Bootcamp](https://bootcamp.laravel.com), where you will be guided through building a modern Laravel application from scratch.

If you don't feel like reading, [Laracasts](https://laracasts.com) can help. Laracasts contains thousands of video tutorials on a range of topics including Laravel, modern PHP, unit testing, and JavaScript. Boost your skills by digging into our comprehensive video library.

## Laravel Sponsors

We would like to extend our thanks to the following sponsors for funding Laravel development. If you are interested in becoming a sponsor, please visit the [Laravel Partners program](https://partners.laravel.com).

### Premium Partners

- **[Vehikl](https://vehikl.com)**
- **[Tighten Co.](https://tighten.co)**
- **[Kirschbaum Development Group](https://kirschbaumdevelopment.com)**
- **[64 Robots](https://64robots.com)**
- **[Curotec](https://www.curotec.com/services/technologies/laravel)**
- **[DevSquad](https://devsquad.com/hire-laravel-developers)**
- **[Redberry](https://redberry.international/laravel-development)**
- **[Active Logic](https://activelogic.com)**

## Contributing

Thank you for considering contributing to the Laravel framework! The contribution guide can be found in the [Laravel documentation](https://laravel.com/docs/contributions).

## Code of Conduct

In order to ensure that the Laravel community is welcoming to all, please review and abide by the [Code of Conduct](https://laravel.com/docs/contributions#code-of-conduct).

## Security Vulnerabilities

If you discover a security vulnerability within Laravel, please send an e-mail to Taylor Otwell via [taylor@laravel.com](mailto:taylor@laravel.com). All security vulnerabilities will be promptly addressed.

## License

The Laravel framework is open-sourced software licensed under the [MIT license](https://opensource.org/licenses/MIT).

---

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
   - `php artisan serve --port=8001` and open http://127.0.0.1:8001

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
