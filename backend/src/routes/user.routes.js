import { Router } from 'express'
import { searchUsers } from '../controllers/user.controllers.js'
import { verifyJWT } from '../middlewares/auth.middleware.js'
import { verifyRole } from '../middlewares/role.middleware.js'

const router = Router()

router.use(verifyJWT, verifyRole('employee', 'admin'))

router.get('/', searchUsers)

export default router
