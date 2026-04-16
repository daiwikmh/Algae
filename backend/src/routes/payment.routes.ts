import { Router } from 'express'
import {
    initiate,
    prepare,
    process,
    getById,
    getByInvoice,
    listByUser,
    listByAgent,
} from '../controllers/payment.controller'

const router: Router = Router()

router.post('/', initiate)
router.post('/:paymentId/prepare', prepare)
router.post('/:paymentId/process', process)
router.get('/', listByUser)
router.get('/invoice/:invoiceId', getByInvoice)
router.get('/agent/:agentId', listByAgent)
router.get('/:paymentId', getById)

export default router