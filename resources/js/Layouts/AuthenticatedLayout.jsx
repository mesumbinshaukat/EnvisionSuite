import Dropdown from '@/Components/Dropdown';
import NavLink from '@/Components/NavLink';
import ResponsiveNavLink from '@/Components/ResponsiveNavLink';
import ShopSelector from '@/Components/ShopSelector';
import { usePage } from '@inertiajs/react';
import { useMemo, useState } from 'react';

function NavTabs() {
    const groups = useMemo(() => ([
        {
            key: 'sales', label: 'Sales', items: [
                { label: 'POS', href: route('pos.index'), active: route().current('pos.index') },
                { label: 'Sales', href: route('sales.index'), active: route().current('sales.*') },
                { label: 'Customers', href: route('customers.index'), active: route().current('customers.index') },
                { label: 'Customer History', href: route().has('customers.history') ? route('customers.history') : '#', active: route().current('customers.history') },
                { label: 'Pricing Rules', href: route().has('pricing.index') ? route('pricing.index') : '#', active: route().current('pricing.*') },
            ]
        },
        {
            key: 'purchases', label: 'Purchases', items: [
                { label: 'Vendors', href: route().has('vendors.index') ? route('vendors.index') : '#', active: route().current('vendors.*') },
                { label: 'Purchases', href: route().has('purchases.index') ? route('purchases.index') : '#', active: route().current('purchases.*') },
                { label: 'Expenses', href: route().has('expenses.index') ? route('expenses.index') : '#', active: route().current('expenses.*') },
            ]
        },
        {
            key: 'inventory', label: 'Inventory', items: [
                { label: 'Products', href: route('products.index'), active: route().current('products.*') },
                { label: 'Categories', href: route().has('categories.index') ? route('categories.index') : '#', active: route().current('categories.*') },
                { label: 'Adjustments', href: route().has('inventory.adjustments.index') ? route('inventory.adjustments.index') : '#', active: route().current('inventory.adjustments.*') },
                { label: 'Inventory Loans', href: route().has('inventory.loans.index') ? route('inventory.loans.index') : '#', active: route().current('inventory.loans.*') },
                { label: 'Inventory Report', href: route().has('reports.inventory') ? route('reports.inventory') : '#', active: route().current('reports.inventory') },
                { label: 'Avg Cost Report', href: route().has('reports.inventoryAverage') ? route('reports.inventoryAverage') : '#', active: route().current('reports.inventoryAverage') },
            ]
        },
        {
            key: 'accounting', label: 'Accounting', items: [
                { label: 'Ledger', href: route('ledger.index'), active: route().current('ledger.index') },
                { label: 'Journals', href: route().has('reports.accounting.journals') ? route('reports.accounting.journals') : '#', active: route().current('reports.accounting.journals') },
                { label: 'Trial Balance', href: route().has('reports.accounting.trialBalance') ? route('reports.accounting.trialBalance') : '#', active: route().current('reports.accounting.trialBalance') },
                { label: 'Profit & Loss', href: route().has('reports.accounting.profitLoss') ? route('reports.accounting.profitLoss') : '#', active: route().current('reports.accounting.profitLoss') },
            ]
        },
        {
            key: 'reports', label: 'Reports', items: [
                { label: 'Sales Report', href: route().has('reports.sales') ? route('reports.sales') : '#', active: route().current('reports.sales') },
                { label: 'Purchases Report', href: route().has('reports.purchases') ? route('reports.purchases') : '#', active: route().current('reports.purchases') },
            ]
        },
        {
            key: 'finance', label: 'Finance', items: [
                { label: 'Finance Summary', href: route().has('finance.summary') ? route('finance.summary') : '#', active: route().current('finance.summary') },
            ]
        },
        {
            key: 'admin', label: 'Admin', items: [
                { label: 'Shops', href: route().has('shops.index') ? route('shops.index') : '#', active: route().current('shops.index') },
            ]
        },
    ]), []);

    return (
        <div className="hidden sm:flex min-w-0 flex-1 items-center">
            <div className="flex items-center gap-4 overflow-visible whitespace-nowrap w-full pr-2">
                <div className="shrink-0">
                    <NavLink href={route('dashboard')} active={route().current('dashboard')}>Dashboard</NavLink>
                </div>
                {groups.map((g) => (
                    <div key={g.key} className="relative shrink-0">
                        <Dropdown>
                            <Dropdown.Trigger>
                                <span className="inline-flex rounded-md">
                                    <button type="button" className={`inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-medium leading-4 ${g.items.some(i=>i.active) ? 'text-indigo-600' : 'text-gray-700'} hover:text-indigo-600`}>
                                        {g.label}
                                        <svg className="-me-0.5 ms-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd"/></svg>
                                    </button>
                                </span>
                            </Dropdown.Trigger>
                            <Dropdown.Content>
                                {g.items.map((it, idx) => (
                                    <Dropdown.Link key={idx} href={it.href} active={it.active}>
                                        {it.label}
                                    </Dropdown.Link>
                                ))}
                            </Dropdown.Content>
                        </Dropdown>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default function AuthenticatedLayout({ header, children }) {
    const { auth, shops, currentShop } = usePage().props;
    const user = auth.user;

    const [showingNavigationDropdown, setShowingNavigationDropdown] =
        useState(false);

    return (
        <div className="min-h-screen bg-gray-100">
            <nav className="border-b border-gray-100 bg-white relative z-50">
                <div className="mx-auto w-full px-4 sm:px-6 lg:px-8">
                    <div className="flex h-16 justify-between">
                        <div className="flex min-w-0 flex-1">
                            <NavTabs />
                        </div>

                        <div className="hidden sm:ms-6 sm:flex sm:items-center shrink-0 space-x-4">
                            <ShopSelector shops={shops} currentShop={currentShop} />
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

            {header && (
                <header className="bg-white shadow">
                    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
                        {header}
                    </div>
                </header>
            )}

            <main>{children}</main>
        </div>
    );
}
