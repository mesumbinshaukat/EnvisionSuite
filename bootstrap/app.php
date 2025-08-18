<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->web(append: [
            \App\Http\Middleware\HandleInertiaRequests::class,
            \Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets::class,
            \App\Http\Middleware\SetCurrentShop::class,
        ]);

        // Support both Spatie namespaces (in case of vendor variations)
        $roleMw = class_exists(\Spatie\Permission\Middlewares\RoleMiddleware::class)
            ? \Spatie\Permission\Middlewares\RoleMiddleware::class
            : (class_exists(\Spatie\Permission\Middleware\RoleMiddleware::class)
                ? \Spatie\Permission\Middleware\RoleMiddleware::class
                : null);
        $permMw = class_exists(\Spatie\Permission\Middlewares\PermissionMiddleware::class)
            ? \Spatie\Permission\Middlewares\PermissionMiddleware::class
            : (class_exists(\Spatie\Permission\Middleware\PermissionMiddleware::class)
                ? \Spatie\Permission\Middleware\PermissionMiddleware::class
                : null);
        $ropMw = class_exists(\Spatie\Permission\Middlewares\RoleOrPermissionMiddleware::class)
            ? \Spatie\Permission\Middlewares\RoleOrPermissionMiddleware::class
            : (class_exists(\Spatie\Permission\Middleware\RoleOrPermissionMiddleware::class)
                ? \Spatie\Permission\Middleware\RoleOrPermissionMiddleware::class
                : null);

        $aliases = [];
        if ($roleMw) { $aliases['role'] = $roleMw; }
        if ($permMw) { $aliases['permission'] = $permMw; }
        if ($ropMw) { $aliases['role_or_permission'] = $ropMw; }
        if ($aliases) { $middleware->alias($aliases); }

        //
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        //
    })->create();
