<?php

namespace Tests\Feature;

use App\Models\Business;
use App\Models\Category;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ApiWorkflowTest extends TestCase
{
    use RefreshDatabase;

    public function test_full_user_and_transaction_flow(): void
    {
        // 1. Test Registration
        $registerResponse = $this->postJson('/api/v1/auth/register', [
            'name' => 'Siti Aminah',
            'email' => 'siti@example.com',
            'password' => 'Rahasia123',
            'password_confirmation' => 'Rahasia123',
            'business_name' => 'Warung Berkah Siti',
            'business_type' => 'Kuliner',
        ]);

        $registerResponse->assertStatus(201)
            ->assertJsonStructure([
                'token',
                'user' => ['id', 'name', 'email'],
                'active_business' => ['id', 'name', 'role'],
            ]);

        $token = $registerResponse->json('token');
        $businessId = $registerResponse->json('active_business.id');

        $headers = [
            'Authorization' => 'Bearer ' . $token,
            'X-Business-Id' => $businessId,
        ];

        // 2. Test Get Categories (Default seeded categories should exist)
        $categoriesResponse = $this->withHeaders($headers)->getJson('/api/v1/categories');
        $categoriesResponse->assertStatus(200);
        $this->assertNotEmpty($categoriesResponse->json('data'));

        $incomeCategory = collect($categoriesResponse->json('data'))->firstWhere('type', 'income');
        $this->assertNotNull($incomeCategory);

        // 3. Test Create Income Transaction
        $trxResponse = $this->withHeaders($headers)->postJson('/api/v1/transactions', [
            'type' => 'income',
            'amount' => 500000,
            'trx_date' => now()->toDateString(),
            'category_id' => $incomeCategory['id'],
            'payment_method' => 'cash',
            'note' => 'Penjualan harian',
        ]);

        $trxResponse->assertStatus(201)
            ->assertJsonPath('data.amount', '500000.00');

        // 4. Test Dashboard Summary
        $dashboardResponse = $this->withHeaders($headers)->getJson('/api/v1/dashboard/summary');
        $dashboardResponse->assertStatus(200)
            ->assertJsonPath('summary.current_balance', 500000)
            ->assertJsonPath('summary.month_income', 500000);

        // 5. Test Profit & Loss Report
        $reportResponse = $this->withHeaders($headers)->getJson('/api/v1/reports/profit-loss');
        $reportResponse->assertStatus(200)
            ->assertJsonPath('total_income', 500000)
            ->assertJsonPath('net_profit', 500000);
    }
}

