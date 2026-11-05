<?php

namespace App\Http\Middleware;

use App\Services\TenantContext;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureActiveBusiness
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (!$user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        // Read business ID from header X-Business-Id or query parameter
        $businessId = $request->header('X-Business-Id') ?: $request->query('business_id');

        if ($businessId) {
            $business = $user->businesses()->where('businesses.id', $businessId)->first();
            if (!$business) {
                return response()->json([
                    'message' => 'Akses ke usaha ini ditolak atau usaha tidak ditemukan.',
                ], 403);
            }
        } else {
            // Default to user's first business if available
            $business = $user->businesses()->first();
        }

        if ($business) {
            app(TenantContext::class)->setBusiness($business);
        }

        return $next($request);
    }
}

