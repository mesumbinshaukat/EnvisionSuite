import Dropdown from '@/Components/Dropdown';
import ResponsiveNavLink from '@/Components/ResponsiveNavLink';
import ShopSelector from '@/Components/ShopSelector';
import GlobalSearch from '@/Components/GlobalSearch';
import Sidebar from '@/Components/Sidebar';
import LanguageSwitcher from '@/Components/LanguageSwitcher';
import HelpInjector from '@/Components/HelpInjector';
import { usePage } from '@inertiajs/react';
import { useMemo, useState } from 'react';

function useNavGroups() {
    return useMemo(() => ([
        { key: 'dashboard', labelKey: 'dashboard', items: [{ labelKey: 'dashboard', href: route('dashboard'), active: route().current('dashboard') }]},
        { key: 'sales', labelKey: 'sales', items: [
            { labelKey: 'pos', href: route('pos.index'), active: route().current('pos.index') },
            { labelKey: 'sales', href: route('sales.index'), active: route().current('sales.*') },
            { labelKey: 'customers', href: route('customers.index'), active: route().current('customers.index') },
            { labelKey: 'customer_history', href: route().has('customers.history') ? route('customers.history') : '#', active: route().current('customers.history') },
            { labelKey: 'walkin_customers', href: route().has('walkin.index') ? route('walkin.index') : '#', active: route().current('walkin.index') },
            { labelKey: 'pricing_rules', href: route().has('pricing.index') ? route('pricing.index') : '#', active: route().current('pricing.*') },
        ] },
        { key: 'purchases', labelKey: 'purchases', items: [
            { labelKey: 'vendors', href: route().has('vendors.index') ? route('vendors.index') : '#', active: route().current('vendors.*') },
            { labelKey: 'purchases', href: route().has('purchases.index') ? route('purchases.index') : '#', active: route().current('purchases.*') },
            { labelKey: 'expenses', href: route().has('expenses.index') ? route('expenses.index') : '#', active: route().current('expenses.*') },
        ] },
        { key: 'inventory', labelKey: 'inventory', items: [
            { labelKey: 'products', href: route('products.index'), active: route().current('products.*') },
            { labelKey: 'categories', href: route().has('categories.index') ? route('categories.index') : '#', active: route().current('categories.*') },
            { labelKey: 'adjustments', href: route().has('inventory.adjustments.index') ? route('inventory.adjustments.index') : '#', active: route().current('inventory.adjustments.*') },
            { labelKey: 'inventory_loans', href: route().has('inventory.loans.index') ? route('inventory.loans.index') : '#', active: route().current('inventory.loans.*') },
            { labelKey: 'inventory_report', href: route().has('reports.inventory') ? route('reports.inventory') : '#', active: route().current('reports.inventory') },
            { labelKey: 'avg_cost_report', href: route().has('reports.inventoryAverage') ? route('reports.inventoryAverage') : '#', active: route().current('reports.inventoryAverage') },
        ] },
        { key: 'accounting', labelKey: 'accounting', items: [
            { labelKey: 'ledger', href: route('ledger.index'), active: route().current('ledger.index') },
            { labelKey: 'journals', href: route().has('reports.accounting.journals') ? route('reports.accounting.journals') : '#', active: route().current('reports.accounting.journals') },
            { labelKey: 'trial_balance', href: route().has('reports.accounting.trialBalance') ? route('reports.accounting.trialBalance') : '#', active: route().current('reports.accounting.trialBalance') },
            { labelKey: 'profit_loss', href: route().has('reports.accounting.profitLoss') ? route('reports.accounting.profitLoss') : '#', active: route().current('reports.accounting.profitLoss') },
        ] },
        { key: 'reports', labelKey: 'reports', items: [
            { labelKey: 'sales_report', href: route().has('reports.sales') ? route('reports.sales') : '#', active: route().current('reports.sales') },
            { labelKey: 'purchases_report', href: route().has('reports.purchases') ? route('reports.purchases') : '#', active: route().current('reports.purchases') },
            { labelKey: 'pos', href: route().has('reports.pos') ? route('reports.pos') : '#', active: route().current('reports.pos') },
        ] },
        { key: 'finance', labelKey: 'finance', items: [
            { labelKey: 'finance_summary', href: route().has('finance.summary') ? route('finance.summary') : '#', active: route().current('finance.summary') },
        ] },
        { key: 'admin', labelKey: 'admin', items: [
            { labelKey: 'shops', href: route().has('shops.index') ? route('shops.index') : '#', active: route().current('shops.index') },
        ] },
    ]), []);
}

export default function AuthenticatedLayout({ header, children }) {
    const { auth, shops, currentShop } = usePage().props;
    const user = auth.user;

    const [showingNavigationDropdown, setShowingNavigationDropdown] =
        useState(false);
    const groups = useNavGroups();

    return (
        <div className="min-h-screen bg-gray-100">
            <nav className="border-b border-gray-100 bg-white sticky top-0 z-50">
                <div className="mx-auto w-full px-4 sm:px-6 lg:px-8">
                    <div className="flex h-16 justify-between">
                        <div className="flex min-w-0 flex-1 items-center">
                            <div className="hidden sm:block">
                                <GlobalSearch items={groups} />
                            </div>
                        </div>

                        <div className="hidden sm:ms-6 sm:flex sm:items-center shrink-0 space-x-4">
                            <ShopSelector shops={shops} currentShop={currentShop} />
                            <LanguageSwitcher />
                            <div className="relative ms-3">
                                <Dropdown>
                                    <Dropdown.Trigger>
                                        <span className="inline-flex rounded-md">
                                            <button
                                                type="button"
                                                className="inline-flex items-center rounded-md border border-transparent bg-white px-3 py-2 text-sm font-medium leading-4 text-gray-500 transition duration-150 ease-in-out hover:text-gray-700 focus:outline-none"
                                            >
                                                {user.name}

                                                <svg
                                                    className="-me-0.5 ms-2 h-4 w-4"
                                                    xmlns="http://www.w3.org/2000/svg"
                                                    viewBox="0 0 20 20"
                                                    fill="currentColor"
                                                >
                                                    <path
                                                        fillRule="evenodd"
                                                        d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                                                        clipRule="evenodd"
                                                    />
                                                </svg>
                                            </button>
                                        </span>
                                    </Dropdown.Trigger>

                                    <Dropdown.Content>
                                        <Dropdown.Link
                                            href={route('profile.edit')}
                                        >
                                            Profile
                                        </Dropdown.Link>
                                        <Dropdown.Link
                                            href={route('logout')}
                                            method="post"
                                            as="button"
                                        >
                                            Log Out
                                        </Dropdown.Link>
                                    </Dropdown.Content>
                                </Dropdown>
                            </div>
                        </div>

                        <div className="-me-2 flex items-center sm:hidden">
                            <button
                                onClick={() =>
                                    setShowingNavigationDropdown(
                                        (previousState) => !previousState,
                                    )
                                }
                                className="inline-flex items-center justify-center rounded-md p-2 text-gray-400 transition duration-150 ease-in-out hover:bg-gray-100 hover:text-gray-500 focus:bg-gray-100 focus:text-gray-500 focus:outline-none"
                            >
                                <svg
                                    className="h-6 w-6"
                                    stroke="currentColor"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        className={
                                            !showingNavigationDropdown
                                                ? 'inline-flex'
                                                : 'hidden'
                                        }
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M4 6h16M4 12h16M4 18h16"
                                    />
                                    <path
                                        className={
                                            showingNavigationDropdown
                                                ? 'inline-flex'
                                                : 'hidden'
                                        }
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="2"
                                        d="M6 18L18 6M6 6l12 12"
                                    />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>

                <div
                    className={
                        (showingNavigationDropdown ? 'block' : 'hidden') +
                        ' sm:hidden'
                    }
                >
                    <div className="space-y-1 pb-3 pt-2">
                        <ResponsiveNavLink href={route('dashboard')} active={route().current('dashboard')}>Dashboard</ResponsiveNavLink>

                        <div className="mt-3 px-3 text-xs font-semibold uppercase text-gray-500">Sales</div>
                        <ResponsiveNavLink href={route('pos.index')} active={route().current('pos.index')}>POS</ResponsiveNavLink>
                        <ResponsiveNavLink href={route('sales.index')} active={route().current('sales.*')}>Sales</ResponsiveNavLink>
                        <ResponsiveNavLink href={route('customers.index')} active={route().current('customers.index')}>Customers</ResponsiveNavLink>
                        <ResponsiveNavLink href={route().has('customers.history') ? route('customers.history') : '#'} active={route().current('customers.history')}>Customer History</ResponsiveNavLink>
                        <ResponsiveNavLink href={route().has('pricing.index') ? route('pricing.index') : '#'} active={route().current('pricing.*')}>Pricing Rules</ResponsiveNavLink>
                        <ResponsiveNavLink href={route().has('walkin.index') ? route('walkin.index') : '#'} active={route().current('walkin.index')}>Walk-in Customers</ResponsiveNavLink>

                        <div className="mt-3 px-3 text-xs font-semibold uppercase text-gray-500">Purchases</div>
                        <ResponsiveNavLink href={route().has('vendors.index') ? route('vendors.index') : '#'} active={route().current('vendors.*')}>Vendors</ResponsiveNavLink>
                        <ResponsiveNavLink href={route().has('purchases.index') ? route('purchases.index') : '#'} active={route().current('purchases.*')}>Purchases</ResponsiveNavLink>
                        <ResponsiveNavLink href={route().has('expenses.index') ? route('expenses.index') : '#'} active={route().current('expenses.*')}>Expenses</ResponsiveNavLink>

                        <div className="mt-3 px-3 text-xs font-semibold uppercase text-gray-500">Inventory</div>
                        <ResponsiveNavLink href={route('products.index')} active={route().current('products.*')}>Products</ResponsiveNavLink>
                        <ResponsiveNavLink href={route().has('categories.index') ? route('categories.index') : '#'} active={route().current('categories.*')}>Categories</ResponsiveNavLink>
                        <ResponsiveNavLink href={route().has('inventory.adjustments.index') ? route('inventory.adjustments.index') : '#'} active={route().current('inventory.adjustments.*')}>Adjustments</ResponsiveNavLink>
                        <ResponsiveNavLink href={route().has('inventory.loans.index') ? route('inventory.loans.index') : '#'} active={route().current('inventory.loans.*')}>Inventory Loans</ResponsiveNavLink>
                        <ResponsiveNavLink href={route().has('reports.inventory') ? route('reports.inventory') : '#'} active={route().current('reports.inventory')}>Inventory Report</ResponsiveNavLink>
                        <ResponsiveNavLink href={route().has('reports.inventoryAverage') ? route('reports.inventoryAverage') : '#'} active={route().current('reports.inventoryAverage')}>Avg Cost Report</ResponsiveNavLink>

                        <div className="mt-3 px-3 text-xs font-semibold uppercase text-gray-500">Accounting</div>
                        <ResponsiveNavLink href={route('ledger.index')} active={route().current('ledger.index')}>Ledger</ResponsiveNavLink>
                        <ResponsiveNavLink href={route().has('reports.accounting.journals') ? route('reports.accounting.journals') : '#'} active={route().current('reports.accounting.journals')}>Journals</ResponsiveNavLink>
                        <ResponsiveNavLink href={route().has('reports.accounting.trialBalance') ? route('reports.accounting.trialBalance') : '#'} active={route().current('reports.accounting.trialBalance')}>Trial Balance</ResponsiveNavLink>
                        <ResponsiveNavLink href={route().has('reports.accounting.profitLoss') ? route('reports.accounting.profitLoss') : '#'} active={route().current('reports.accounting.profitLoss')}>Profit & Loss</ResponsiveNavLink>

                        <div className="mt-3 px-3 text-xs font-semibold uppercase text-gray-500">Reports</div>
                        <ResponsiveNavLink href={route().has('reports.sales') ? route('reports.sales') : '#'} active={route().current('reports.sales')}>Sales Report</ResponsiveNavLink>
                        <ResponsiveNavLink href={route().has('reports.purchases') ? route('reports.purchases') : '#'} active={route().current('reports.purchases')}>Purchases Report</ResponsiveNavLink>

                        <div className="mt-3 px-3 text-xs font-semibold uppercase text-gray-500">Finance</div>
                        <ResponsiveNavLink href={route().has('finance.summary') ? route('finance.summary') : '#'} active={route().current('finance.summary')}>Finance Summary</ResponsiveNavLink>

                        <div className="mt-3 px-3 text-xs font-semibold uppercase text-gray-500">Admin</div>
                        <ResponsiveNavLink href={route().has('shops.index') ? route('shops.index') : '#'} active={route().current('shops.index')}>Shops</ResponsiveNavLink>
                    </div>

                    <div className="border-t border-gray-200 pb-1 pt-4">
                        <div className="px-4">
                            <div className="text-base font-medium text-gray-800">
                                {user.name}
                            </div>
                            <div className="text-sm font-medium text-gray-500">
                                {user.email}
                            </div>
                        </div>

                        <div className="mt-3 space-y-1">
                            <ResponsiveNavLink href={route('profile.edit')}>
                                Profile
                            </ResponsiveNavLink>
                            <ResponsiveNavLink
                                method="post"
                                href={route('logout')}
                                as="button"
                            >
                                Log Out
                            </ResponsiveNavLink>
                        </div>
                    </div>
                </div>
            </nav>

            <div className="mx-auto w-full">
                {header && (
                    <header className="bg-white shadow">
                        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
                            {header}
                        </div>
                    </header>
                )}

                <div className="flex">
                    <Sidebar />
                    <main className="flex-1 min-w-0">{children}</main>
                </div>
            </div>
            <HelpInjector />
        </div>
    );
}
