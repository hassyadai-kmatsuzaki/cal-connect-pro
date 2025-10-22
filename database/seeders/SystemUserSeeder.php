<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\SystemUser;
use Illuminate\Support\Facades\Hash;

class SystemUserSeeder extends Seeder
{
    public function run(): void
    {
        // Check if system admin already exists
        if (SystemUser::where('email', 'admin@cal-connect.com')->exists()) {
            $this->command->info('System administrator already exists!');
            $this->command->info('Email: admin@cal-connect.com');
            return;
        }

        SystemUser::create([
            'name' => 'System Administrator',
            'email' => 'admin@cal-connect.com',
            'password' => Hash::make('password'),
            'role' => 'system_admin',
        ]);

        $this->command->info('System administrator created successfully!');
        $this->command->info('Email: admin@cal-connect.com');
        $this->command->info('Password: password');
    }
}
