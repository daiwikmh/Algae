
export interface CreateApiKeyRequest {
    name: string
    companyName: string
    network: 'mainnet' | 'testnet'
}

export interface CreateApiKeyResponse {
    id: string
    key: string
    name: string
    companyName: string
    network: 'mainnet' | 'testnet'
    createdAt: string
}

export interface ValidateApiKeyResponse {
    id: string
    userId: string
    name: string
    companyName: string
    network: 'mainnet' | 'testnet'
    createdAt: string
}

export interface RevokeApiKeyResponse {
    success: boolean
    message: string
}


declare global {
    namespace Express {
        interface Request {
            apiKey?: ValidateApiKeyResponse
            userId?: string
        }
    }
}