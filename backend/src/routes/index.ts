import { Router } from 'express'
import authRoutes from './auth.routes'
import apiKeyRoutes from './api-key.routes'
import { jwtMiddleware } from '../middleware/jwt'
import gasPoolRoutes from './gas-pool.routes'
import agentRoutes from './agent.routes'
import paymentRoutes from './payment.routes'
import webhookRoutes from './webhook.routes'
import auditRoutes from './audit.routes';
const router: Router = Router()

router.use('/auth', authRoutes)

router.use('/keys', jwtMiddleware, apiKeyRoutes)
router.use('/gas-pool', jwtMiddleware, gasPoolRoutes);
router.use('/agents', jwtMiddleware, agentRoutes)
router.use('/payments', jwtMiddleware, paymentRoutes)
router.use('/webhooks', jwtMiddleware, webhookRoutes)
router.use('/audit', jwtMiddleware, auditRoutes);


export default router