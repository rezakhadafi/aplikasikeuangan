<?php

namespace Tests\Feature;

use App\Models\Business;
use App\Models\Category;
use App\Models\User;
use App\Services\TenantContext;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TenantIsolationTest extends TestCase
{
    use RefreshDatabase;

    public function test_tenant_global_scope_isolates_records(): void
    {
        // 1. Create two businesses
        $bizA = Business::create(['name' => 'Usaha A']);
        $bizB = Business::create(['name' => 'Usaha B']);

        // 2. Create categories for both businesses
        $catA = Category::create([
            'business_id' => $bizA->id,
            'name' => 'Kategori Khusus A',
            'type' => 'income',
        ]);

        $catB = Category::create([
            'business_id' => $bizB->id,
            'name' => 'Kategori Khusus B',
            'type' => 'income',
        ]);

        // 3. Set Tenant Context to Business A
        $context = app(TenantContext::class);
        $context->setBusiness($bizA);

        // When querying categories under Biz A context, Biz B must not be visible
        $resultsForA = Category::all();
        $this->assertTrue($resultsForA->contains($catA));
        $this->assertFalse($resultsForA->contains($catB));

        // 4. Set Tenant Context to Business B
        $context->setBusiness($bizB);
        $resultsForB = Category::all();
        $this->assertFalse($resultsForB->contains($catA));
        $this->assertTrue($resultsForB->contains($catB));
    }
}

