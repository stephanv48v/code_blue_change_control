<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\DB;

/**
 * Re-encrypt existing plaintext JSON credentials using Laravel's encrypter.
 *
 * The IntegrationConnection model cast was changed from 'array' to 'encrypted:array'.
 * Any rows that already have credentials stored as plain JSON need to be re-encrypted
 * so the model can read them correctly.
 */
return new class extends Migration
{
    public function up(): void
    {
        $rows = DB::table('integration_connections')
            ->whereNotNull('credentials')
            ->get(['id', 'credentials']);

        foreach ($rows as $row) {
            // Skip if already encrypted (Crypt payloads start with 'eyJ')
            if (str_starts_with($row->credentials, 'eyJ')) {
                continue;
            }

            // Attempt to decode as plain JSON — if it works, it needs encryption
            $decoded = json_decode($row->credentials, true);

            if (json_last_error() === JSON_ERROR_NONE) {
                DB::table('integration_connections')
                    ->where('id', $row->id)
                    ->update([
                        'credentials' => Crypt::encryptString($row->credentials),
                    ]);
            }
        }
    }

    public function down(): void
    {
        // Decrypting back to plaintext is intentionally not supported for security.
    }
};
