import { Router } from 'express'
import {
    githubLogin,
    githubCallback,
    googleLogin,
    googleCallback,
    me,
    refreshToken,
    logout,
    devLogin,
} from '../controllers/auth.controller'
import { jwtMiddleware } from '../middleware/jwt'

const router: Router = Router()

router.get('/github', githubLogin)
router.get('/github/callback', githubCallback)
router.get('/google', googleLogin)
router.post('/refresh', refreshToken)
router.post('/logout', logout)
router.get('/google/callback', googleCallback)
router.get('/me', jwtMiddleware, me)
router.post('/dev-login', devLogin)

export default router