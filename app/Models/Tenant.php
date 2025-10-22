<?php

namespace App\Models;

use Stancl\Tenancy\Database\Models\Tenant as BaseTenant;
use Stancl\Tenancy\Contracts\TenantWithDatabase;
use Stancl\Tenancy\Database\Concerns\HasDatabase;
use Stancl\Tenancy\Database\Concerns\HasDomains;

class Tenant extends BaseTenant implements TenantWithDatabase
{
    use HasDatabase, HasDomains;

    protected $fillable = [
        'id',
        'owner_id',
        'company_name',
        'plan',
    ];

    public static function getCustomColumns(): array
    {
        return [
            'id',
            'owner_id',
            'company_name',
            'plan',
        ];
    }

    public function owner()
    {
        return $this->belongsTo(CentralUser::class, 'owner_id');
    }
}