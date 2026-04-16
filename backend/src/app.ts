import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import router from './routes/index'
import rateLimit from 'express-rate-limit'
import { requestLogger } from './middleware/request-logger'
import { db } from '../db/client'
import { errorHandler } from './middleware/error'
import { requestId } from './middleware/request-id'
import cookieParser from 'cookie-parser'

const app: express.Application = express()

app.set('trust proxy', 1)

app.use((req, res, next) => {
    if (
        process.env.NODE_ENV === 'production' &&
        req.headers['x-forwarded-proto'] !== 'https'
    ) {
        res.redirect(301, `https://${req.headers.host}${req.url}`)
        return
    }
    next()
})

app.use(cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}))

app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'"],
            styleSrc: ["'self'"],
            imgSrc: ["'self'", 'data:'],
        },
    },
}))

app.use(express.json({ limit: '10kb' }))
app.use(cookieParser())

app.use(requestId)
app.use(requestLogger)

const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    message: { error: 'Too many requests, please try again later' },
})

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    message: { error: 'Too many auth attempts, please try again later' },
})

app.use('/api/v1', globalLimiter)
app.use('/api/v1/auth', authLimiter)

app.use((_req, res, next) => {
    const originalJson = res.json.bind(res)
    res.json = function (body) {
        return originalJson(
            JSON.parse(
                JSON.stringify(body, (_key, value) =>
                    typeof value === 'bigint' ? value.toString() : value
                )
            )
        )
    }
    next()
})

app.use('/api/v1', router)

app.get('/health', async (_req, res) => {
    try {
        await db.$queryRaw`SELECT 1`
        res.json({ status: 'ok', version: '0.1.0', db: 'connected' })
    } catch {
        res.status(503).json({ status: 'error', db: 'disconnected' })
    }
})

app.use(errorHandler)

export default app