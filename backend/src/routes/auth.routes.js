import { Router } from 'express'
import { register, login, logout } from '../controllers/auth.controllers.js'
import { verifyJWT } from '../middlewares/auth.middleware.js'
import { register, login, logout, getCurrentUser, refreshAccessToken } from '../controllers/auth.controllers.js'

const router = Router()

router.post('/register', register)
router.post('/login', login)
router.post('/logout', verifyJWT, logout)
router.post('/refresh-token', refreshAccessToken)
router.get('/me', verifyJWT, getCurrentUser)

export default router
