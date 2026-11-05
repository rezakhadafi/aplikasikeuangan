<?php

namespace Database\Seeders;

use App\Models\Business;
use App\Models\Category;
use Illuminate\Database\Seeder;

class DefaultCategorySeeder extends Seeder
{
    /**
     * Default categories list according to BRS FR-11
     */
    public const DEFAULT_CATEGORIES = [
        ['type' => 'income', 'name' => 'Penjualan'],
        ['type' => 'income', 'name' => 'Pendapatan Jasa'],
        ['type' => 'income', 'name' => 'Modal Usaha'],
        ['type' => 'income', 'name' => 'Pendapatan Lain'],
        ['type' => 'expense', 'name' => 'Pembelian Bahan/Stok'],
        ['type' => 'expense', 'name' => 'Sewa Tempat'],
        ['type' => 'expense', 'name' => 'Gaji & Upah'],
        ['type' => 'expense', 'name' => 'Listrik, Air & Internet'],
        ['type' => 'expense', 'name' => 'Transport & Pengiriman'],
        ['type' => 'expense', 'name' => 'Operasional Lain'],
    ];

    /**
     * Seed default categories for a specific business.
     */
    public static function seedForBusiness(Business|int $business): void
    {
        $businessId = $business instanceof Business ? $business->id : $business;

        foreach (self::DEFAULT_CATEGORIES as $cat) {
            Category::firstOrCreate([
                'business_id' => $businessId,
                'name' => $cat['name'],
                'type' => $cat['type'],
            ], [
                'is_active' => true,
            ]);
        }
    }

    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $businesses = Business::all();
        foreach ($businesses as $business) {
            self::seedForBusiness($business);
        }
    }
}

