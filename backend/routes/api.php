<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BusinessController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\ContactController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\TransactionController;
use App\Http\Middleware\EnsureActiveBusiness;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {
    // Public Auth
    Route::post('/auth/register', [AuthController::class, 'register']);
    Route::post('/auth/login', [AuthController::class, 'login'])->middleware('throttle:10,1');

    // Authenticated Routes
    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/auth/logout', [AuthController::class, 'logout']);
        Route::get('/auth/me', [AuthController::class, 'me']);

        // Business listing & creation
        Route::get('/businesses', [BusinessController::class, 'index']);
        Route::post('/businesses', [BusinessController::class, 'store']);

        // Routes requiring active business context
        Route::middleware(EnsureActiveBusiness::class)->group(function () {
            // Business Details & Team
            Route::get('/businesses/{id}', [BusinessController::class, 'show']);
            Route::put('/businesses/{id}', [BusinessController::class, 'update']);
            Route::post('/businesses/{id}/members', [BusinessController::class, 'addMember']);
            Route::delete('/businesses/{id}/members/{userId}', [BusinessController::class, 'removeMember']);

            // Categories
            Route::apiResource('categories', CategoryController::class);

            // Transactions
            Route::apiResource('transactions', TransactionController::class);

            // Products & Stock
            Route::apiResource('products', ProductController::class);
            Route::post('/products/{product}/adjust-stock', [ProductController::class, 'adjustStock']);

            // Contacts
            Route::apiResource('contacts', ContactController::class);

            // Dashboard
            Route::get('/dashboard/summary', [DashboardController::class, 'summary']);

            // Reports
            Route::get('/reports/profit-loss', [ReportController::class, 'profitLoss']);
            Route::get('/reports/cash-flow', [ReportController::class, 'cashFlow']);
            Route::get('/reports/by-category', [ReportController::class, 'byCategory']);
            Route::get('/reports/export', [ReportController::class, 'export']);
        });
    });
});
