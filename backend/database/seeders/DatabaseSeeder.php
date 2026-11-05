<?php

namespace Database\Seeders;

use App\Models\Business;
use App\Models\Category;
use App\Models\Product;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database with demo data.
     */
    public function run(): void
    {
        // 1. Create Demo Owner
        $owner = User::firstOrCreate([
            'email' => 'owner@kasumkm.test',
        ], [
            'name' => 'Bu Siti (Owner)',
            'password' => Hash::make('password123'),
            'email_verified_at' => now(),
        ]);

        // 2. Create Demo Staff
        $staff = User::firstOrCreate([
            'email' => 'staff@kasumkm.test',
        ], [
            'name' => 'Budi (Kasir)',
            'password' => Hash::make('password123'),
            'email_verified_at' => now(),
        ]);

        // 3. Create Demo Business
        $business = Business::firstOrCreate([
            'name' => 'Warung Bu Siti',
        ], [
            'type' => 'Kuliner & Sembako',
            'currency' => 'IDR',
        ]);

        // 4. Attach users to business
        $business->users()->syncWithoutDetaching([
            $owner->id => ['role' => 'owner'],
            $staff->id => ['role' => 'staff'],
        ]);

        // 5. Seed default categories
        DefaultCategorySeeder::seedForBusiness($business);

        // 6. Seed demo products
        $prod1 = Product::firstOrCreate([
            'business_id' => $business->id,
            'name' => 'Beras Pandan Wangi 5kg',
        ], [
            'cost_price' => 65000,
            'sell_price' => 75000,
            'stock' => 20,
            'min_stock' => 5,
        ]);

        $prod2 = Product::firstOrCreate([
            'business_id' => $business->id,
            'name' => 'Minyak Goreng 2L',
        ], [
            'cost_price' => 28000,
            'sell_price' => 34000,
            'stock' => 15,
            'min_stock' => 3,
        ]);

        // 7. Seed sample transactions
        $catPenjualan = Category::where('business_id', $business->id)->where('name', 'Penjualan')->first();
        $catSewa = Category::where('business_id', $business->id)->where('name', 'Sewa Tempat')->first();
        $catStok = Category::where('business_id', $business->id)->where('name', 'Pembelian Bahan/Stok')->first();

        if ($catPenjualan && $catSewa && $catStok) {
            Transaction::firstOrCreate([
                'business_id' => $business->id,
                'category_id' => $catPenjualan->id,
                'user_id' => $owner->id,
                'amount' => 8000000,
                'trx_date' => now()->toDateString(),
            ], [
                'type' => 'income',
                'payment_method' => 'cash',
                'note' => 'Rekap penjualan awal bulan',
            ]);

            Transaction::firstOrCreate([
                'business_id' => $business->id,
                'category_id' => $catSewa->id,
                'user_id' => $owner->id,
                'amount' => 1500000,
                'trx_date' => now()->subDays(2)->toDateString(),
            ], [
                'type' => 'expense',
                'payment_method' => 'transfer',
                'note' => 'Sewa kios bulanan',
            ]);

            Transaction::firstOrCreate([
                'business_id' => $business->id,
                'category_id' => $catStok->id,
                'user_id' => $owner->id,
                'amount' => 1700000,
                'trx_date' => now()->subDays(1)->toDateString(),
            ], [
                'type' => 'expense',
                'payment_method' => 'cash',
                'note' => 'Restock sembako mingguan',
            ]);
        }
    }
}
