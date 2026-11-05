<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Business;
use App\Models\User;
use Database\Seeders\DefaultCategorySeeder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    /**
     * Register a new user and create their first business.
     */
    public function register(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'email' => ['required', 'string', 'email', 'max:150', 'unique:users,email'],
            'password' => ['required', 'string', 'confirmed', Password::min(8)->letters()->numbers()],
            'business_name' => ['nullable', 'string', 'max:120'],
            'business_type' => ['nullable', 'string', 'max:50'],
        ]);

        return DB::transaction(function () use ($validated, $request) {
            $user = User::create([
                'name' => $validated['name'],
                'email' => $validated['email'],
                'password' => Hash::make($validated['password']),
                'email_verified_at' => now(), // Auto verify for simplicity
            ]);

            $businessName = !empty($validated['business_name']) ? $validated['business_name'] : 'Usaha ' . $user->name;
            $business = Business::create([
                'name' => $businessName,
                'type' => $validated['business_type'] ?? 'Retail/Jasa',
                'currency' => 'IDR',
            ]);

            // Assign owner role
            $business->users()->attach($user->id, ['role' => 'owner']);

            // Auto-seed default categories for this business
            DefaultCategorySeeder::seedForBusiness($business);

            $token = $user->createToken('auth_token')->plainTextToken;

            return response()->json([
                'message' => 'Registrasi berhasil',
                'token' => $token,
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                ],
                'active_business' => [
                    'id' => $business->id,
                    'name' => $business->name,
                    'role' => 'owner',
                    'currency' => $business->currency,
                ],
            ], 201);
        });
    }

    /**
     * Authenticate user and issue API token.
     */
    public function login(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'email' => ['required', 'string', 'email'],
            'password' => ['required', 'string'],
        ]);

        $user = User::where('email', $validated['email'])->first();

        if (!$user || !Hash::check($validated['password'], $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['Kombinasi email dan kata sandi tidak cocok.'],
            ]);
        }

        $token = $user->createToken('auth_token')->plainTextToken;
        $businesses = $user->businesses()->get()->map(function ($biz) {
            return [
                'id' => $biz->id,
                'name' => $biz->name,
                'type' => $biz->type,
                'currency' => $biz->currency,
                'role' => $biz->pivot->role,
            ];
        });

        $activeBusiness = $businesses->first();

        return response()->json([
            'message' => 'Login berhasil',
            'token' => $token,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
            ],
            'active_business' => $activeBusiness,
            'businesses' => $businesses,
        ]);
    }

    /**
     * Revoke current access token.
     */
    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()?->delete();

        return response()->json([
            'message' => 'Berhasil keluar dari akun.',
        ]);
    }

    /**
     * Get authenticated user profile with accessible businesses.
     */
    public function me(Request $request): JsonResponse
    {
        $user = $request->user();
        $businesses = $user->businesses()->get()->map(function ($biz) {
            return [
                'id' => $biz->id,
                'name' => $biz->name,
                'type' => $biz->type,
                'currency' => $biz->currency,
                'role' => $biz->pivot->role,
            ];
        });

        return response()->json([
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
            ],
            'businesses' => $businesses,
        ]);
    }
}

