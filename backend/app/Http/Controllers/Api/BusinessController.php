<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Business;
use App\Models\User;
use Database\Seeders\DefaultCategorySeeder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class BusinessController extends Controller
{
    /**
     * List all businesses accessible by the user.
     */
    public function index(Request $request): JsonResponse
    {
        $businesses = $request->user()->businesses()->get()->map(function ($biz) {
            return [
                'id' => $biz->id,
                'name' => $biz->name,
                'type' => $biz->type,
                'currency' => $biz->currency,
                'logo' => $biz->logo,
                'role' => $biz->pivot->role,
            ];
        });

        return response()->json(['data' => $businesses]);
    }

    /**
     * Create a new business.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'type' => ['nullable', 'string', 'max:50'],
            'currency' => ['nullable', 'string', 'max:5'],
        ]);

        return DB::transaction(function () use ($validated, $request) {
            $business = Business::create([
                'name' => $validated['name'],
                'type' => $validated['type'] ?? 'Retail/Jasa',
                'currency' => $validated['currency'] ?? 'IDR',
            ]);

            // Attach user as owner
            $business->users()->attach($request->user()->id, ['role' => 'owner']);

            // Auto seed default categories
            DefaultCategorySeeder::seedForBusiness($business);

            return response()->json([
                'message' => 'Usaha berhasil dibuat.',
                'data' => [
                    'id' => $business->id,
                    'name' => $business->name,
                    'type' => $business->type,
                    'currency' => $business->currency,
                    'role' => 'owner',
                ],
            ], 201);
        });
    }

    /**
     * Get details of a business.
     */
    public function show(Request $request, int $id): JsonResponse
    {
        $business = $request->user()->businesses()->where('businesses.id', $id)->first();

        if (!$business) {
            return response()->json(['message' => 'Usaha tidak ditemukan atau akses ditolak.'], 404);
        }

        return response()->json([
            'data' => [
                'id' => $business->id,
                'name' => $business->name,
                'type' => $business->type,
                'currency' => $business->currency,
                'role' => $business->pivot->role,
                'members' => $business->users()->get()->map(fn ($u) => [
                    'id' => $u->id,
                    'name' => $u->name,
                    'email' => $u->email,
                    'role' => $u->pivot->role,
                ]),
            ],
        ]);
    }

    /**
     * Update business profile (Owner only).
     */
    public function update(Request $request, int $id): JsonResponse
    {
        $business = $request->user()->businesses()->where('businesses.id', $id)->first();

        if (!$business) {
            return response()->json(['message' => 'Usaha tidak ditemukan atau akses ditolak.'], 404);
        }

        if ($business->pivot->role !== 'owner') {
            return response()->json(['message' => 'Hanya Owner yang dapat mengubah data usaha.'], 403);
        }

        $validated = $request->validate([
            'name' => ['sometimes', 'required', 'string', 'max:120'],
            'type' => ['nullable', 'string', 'max:50'],
            'currency' => ['nullable', 'string', 'max:5'],
        ]);

        $business->update($validated);

        return response()->json([
            'message' => 'Data usaha berhasil diperbarui.',
            'data' => $business,
        ]);
    }

    /**
     * Add or invite member to business (Owner only).
     */
    public function addMember(Request $request, int $id): JsonResponse
    {
        $business = $request->user()->businesses()->where('businesses.id', $id)->first();

        if (!$business || $business->pivot->role !== 'owner') {
            return response()->json(['message' => 'Akses ditolak. Hanya Owner yang dapat menambah anggota.'], 403);
        }

        $validated = $request->validate([
            'email' => ['required', 'email'],
            'role' => ['required', 'in:owner,staff'],
        ]);

        $targetUser = User::where('email', $validated['email'])->first();

        if (!$targetUser) {
            return response()->json(['message' => 'Pengguna dengan email tersebut belum terdaftar di sistem.'], 404);
        }

        $business->users()->syncWithoutDetaching([
            $targetUser->id => ['role' => $validated['role']],
        ]);

        return response()->json(['message' => 'Anggota berhasil ditambahkan ke usaha.']);
    }

    /**
     * Remove member from business (Owner only).
     */
    public function removeMember(Request $request, int $id, int $userId): JsonResponse
    {
        $business = $request->user()->businesses()->where('businesses.id', $id)->first();

        if (!$business || $business->pivot->role !== 'owner') {
            return response()->json(['message' => 'Akses ditolak. Hanya Owner yang dapat menghapus anggota.'], 403);
        }

        if ($request->user()->id === $userId) {
            return response()->json(['message' => 'Anda tidak dapat menghapus akun Anda sendiri dari usaha ini.'], 422);
        }

        $business->users()->detach($userId);

        return response()->json(['message' => 'Anggota berhasil dihapus dari usaha.']);
    }
}

