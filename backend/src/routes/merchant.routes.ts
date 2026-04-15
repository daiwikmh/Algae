import { Router } from 'express'
import { create, list, get, remove } from '../controllers/merchant.controller'

const router: Router = Router()

router.post('/', create)
router.get('/', list)
router.get('/:merchantId', get)
router.delete('/:merchantId', remove)

export default router
