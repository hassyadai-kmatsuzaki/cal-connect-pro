<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\CentralUser;
use Illuminate\Support\Facades\Hash;

class CentralUserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // 開発用のテストユーザーを作成
        CentralUser::create([
            'name' => 'テストユーザー',
            'email' => 'test@example.com',
            'password' => Hash::make('password'),
            'email_verified_at' => now(),
        ]);

        // 管理者ユーザーを作成
        CentralUser::create([
            'name' => '管理者',
            'email' => 'admin@example.com',
            'password' => Hash::make('password'),
            'email_verified_at' => now(),
        ]);

        $this->command->info('CentralUserを2件作成しました！');
        $this->command->info('Email: test@example.com / Password: password');
        $this->command->info('Email: admin@example.com / Password: password');
    }
}
