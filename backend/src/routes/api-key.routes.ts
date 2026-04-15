import { Router } from 'express'
import {
    register,
    revoke,
    revokeById,
    validate,
    listKeys,
} from '../controllers/api-key.controller'
import { authM } from '../middleware/auth'

const router: Router = Router()

router.post('/register', register)
router.get('/', listKeys)
router.get('/validate', authM, validate)
router.delete('/revoke', authM, revoke)
router.delete('/:keyId', revokeById)

export default router