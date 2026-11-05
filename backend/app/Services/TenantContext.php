<?php

namespace App\Services;

use App\Models\Business;

class TenantContext
{
    protected ?int $businessId = null;
    protected ?Business $business = null;

    public function setBusinessId(?int $businessId): void
    {
        $this->businessId = $businessId;
        $this->business = null;
    }

    public function getBusinessId(): ?int
    {
        return $this->businessId;
    }

    public function setBusiness(?Business $business): void
    {
        $this->business = $business;
        $this->businessId = $business?->id;
    }

    public function getBusiness(): ?Business
    {
        if (!$this->business && $this->businessId) {
            $this->business = Business::find($this->businessId);
        }

        return $this->business;
    }
}

