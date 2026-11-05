<?php

namespace App\Traits;

use App\Models\Business;
use App\Models\Scopes\BusinessScope;
use App\Services\TenantContext;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

trait BelongsToBusiness
{
    /**
     * Boot the trait to attach global scope and auto-assign business_id on create.
     */
    protected static function bootBelongsToBusiness(): void
    {
        static::addGlobalScope(new BusinessScope());

        static::creating(function ($model) {
            if (empty($model->business_id)) {
                $tenantContext = app(TenantContext::class);
                $model->business_id = $tenantContext->getBusinessId();
            }
        });
    }

    /**
     * Get the business that owns the model.
     */
    public function business(): BelongsTo
    {
        return $this->belongsTo(Business::class);
    }
}

