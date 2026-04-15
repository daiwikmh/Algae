const required = [
    'PORT',
    'DATABASE_URL',
    'JWT_SECRET',
    'GITHUB_CLIENT_ID',
    'GITHUB_CLIENT_SECRET',
    'GOOGLE_CLIENT_ID',
    'GOOGLE_CLIENT_SECRET',
    'FRONTEND_URL',
    'DEPLOYER_MNEMONIC',
    'MERCHANT_REGISTRY_APP_ID',
    'PAYMENT_PROCESSOR_APP_ID',
    'PAYMENT_PROCESSOR_ADDRESS',
]

export function validateEnv() {
    const missing = required.filter((key) => !process.env[key])
    if (missing.length > 0) {
        console.warn(`Missing required env vars: ${missing.join(', ')}`)
        process.exit(1)
    }
    console.log('required env vars are set')
}
