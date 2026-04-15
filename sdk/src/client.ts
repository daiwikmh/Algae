import { AlgopayConfig, AlgopayError } from './types'
import { sanitizeParams } from './lib/sanitize'
import { signRequest } from './lib/crypto'

const DEFAULT_TIMEOUT_MS = 10000
const MAX_RETRIES = 2
const API_KEY_PREFIX = 'as_'
const API_KEY_MIN_LENGTH = 10

export class AlgopayRequestError extends Error {
    readonly code: string
    readonly status: number

    constructor(message: string, code: string, status: number) {
        super(message)
        this.name = 'AlgopayRequestError'
        this.code = code
        this.status = status
    }
}

function sanitizeErrorMessage(message: string): string {
    return message
        .replace(/\/[a-zA-Z0-9/_\-\.]+\.(ts|js)/g, '[file]')
        .replace(/at .+:\d+:\d+/g, '')
        .replace(/\n/g, ' ')
        .replace(/password|secret|key|token/gi, '[redacted]')
        .trim()
        .substring(0, 200)
}

function validateConfig(config: AlgopayConfig): void {
    if (!config || typeof config !== 'object') {
        throw new AlgopayRequestError('Config must be an object', 'INVALID_CONFIG', 0)
    }
    if (!config.apiKey || typeof config.apiKey !== 'string') {
        throw new AlgopayRequestError('apiKey is required', 'INVALID_CONFIG', 0)
    }
    if (!config.apiKey.startsWith(API_KEY_PREFIX)) {
        throw new AlgopayRequestError(
            'Invalid API key format — must start with as_',
            'INVALID_API_KEY',
            0
        )
    }
    if (config.apiKey.length < API_KEY_MIN_LENGTH) {
        throw new AlgopayRequestError('Invalid API key — too short', 'INVALID_API_KEY', 0)
    }
    if (config.baseUrl) {
        try {
            const parsed = new URL(config.baseUrl)
            if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error()
        } catch {
            throw new AlgopayRequestError(
                'Invalid baseUrl — must be a valid HTTP/HTTPS URL',
                'INVALID_CONFIG',
                0
            )
        }
    }
    if (config.network && !['mainnet', 'testnet'].includes(config.network)) {
        throw new AlgopayRequestError(
            'Invalid network — must be mainnet or testnet',
            'INVALID_CONFIG',
            0
        )
    }
    if (
        config.timeoutMs !== undefined &&
        (typeof config.timeoutMs !== 'number' ||
            config.timeoutMs < 1000 ||
            config.timeoutMs > 60000)
    ) {
        throw new AlgopayRequestError(
            'timeoutMs must be between 1000 and 60000',
            'INVALID_CONFIG',
            0
        )
    }
}

export class AlgopayClient {
    readonly #apiKey: string
    readonly #baseUrl: string
    readonly #network: string
    readonly #timeoutMs: number

    constructor(config: AlgopayConfig) {
        validateConfig(config)
        this.#apiKey = config.apiKey
        this.#baseUrl = (config.baseUrl ?? 'https://api.algopay.dev/api/v1').replace(/\/$/, '')
        this.#network = config.network ?? 'testnet'
        this.#timeoutMs = config.timeoutMs ?? DEFAULT_TIMEOUT_MS
    }

    private async request<T>(
        method: string,
        path: string,
        body?: unknown,
        params?: Record<string, string | number | undefined>
    ): Promise<T> {
        const url = new URL(`${this.#baseUrl}${path}`)
        if (params) {
            const clean = sanitizeParams(params)
            Object.entries(clean).forEach(([k, v]) => url.searchParams.set(k, v))
        }

        const timestamp = Date.now().toString()
        const signature = await signRequest(method, path, timestamp, this.#apiKey)

        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.#apiKey}`,
            'X-Algopay-Network': this.#network,
            'X-Algopay-Timestamp': timestamp,
            'X-Algopay-Signature': signature,
        }

        let serializedBody: string | undefined
        if (body !== undefined) {
            try {
                serializedBody = JSON.stringify(body)
            } catch {
                throw new AlgopayRequestError(
                    'Request body could not be serialized',
                    'INVALID_BODY',
                    0
                )
            }
        }

        let lastError: Error | null = null

        for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
            const controller = new AbortController()
            const timeout = setTimeout(() => controller.abort(), this.#timeoutMs)

            try {
                const res = await fetch(url.toString(), {
                    method: method.toUpperCase(),
                    headers,
                    signal: controller.signal,
                    ...(serializedBody ? { body: serializedBody } : {}),
                })

                clearTimeout(timeout)

                const contentType = res.headers.get('content-type') ?? ''
                let data: unknown

                if (contentType.includes('application/json')) {
                    try {
                        data = await res.json()
                    } catch {
                        throw new AlgopayRequestError(
                            'Response could not be parsed as JSON',
                            'PARSE_ERROR',
                            res.status
                        )
                    }
                } else {
                    data = await res.text()
                }

                if (!res.ok) {
                    const err = data as AlgopayError
                    const message = sanitizeErrorMessage(
                        err?.error ?? `Request failed with status ${res.status}`
                    )
                    throw new AlgopayRequestError(
                        message,
                        err?.code ?? 'REQUEST_FAILED',
                        res.status
                    )
                }

                return data as T

            } catch (err: any) {
                clearTimeout(timeout)
                if (err instanceof AlgopayRequestError) throw err

                if (err.name === 'AbortError') {
                    throw new AlgopayRequestError(
                        `Request timed out after ${this.#timeoutMs}ms`,
                        'TIMEOUT',
                        0
                    )
                }

                lastError = err
                if (attempt < MAX_RETRIES) {
                    await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 500))
                    continue
                }
            }
        }

        throw new AlgopayRequestError(
            `Network error — ${lastError?.message ?? 'request failed after retries'}`,
            'NETWORK_ERROR',
            0
        )
    }

    get<T>(path: string, params?: Record<string, string | number | undefined>): Promise<T> {
        return this.request<T>('GET', path, undefined, params)
    }

    post<T>(path: string, body?: unknown): Promise<T> {
        return this.request<T>('POST', path, body)
    }

    patch<T>(path: string, body?: unknown): Promise<T> {
        return this.request<T>('PATCH', path, body)
    }

    delete<T>(path: string): Promise<T> {
        return this.request<T>('DELETE', path)
    }
}
