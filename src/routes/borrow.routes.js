import { Router } from 'express'
import { borrowBook, returnBook } from '../controllers/borrow.controllers.js'
import { verifyJWT } from '../middlewares/auth.middleware.js'
import { verifyRole } from '../middlewares/role.middleware.js'

const router = Router()

router.use(verifyJWT, verifyRole('employee', 'admin'))

router.post('/issue', borrowBook)
router.post('/return', returnBook)

export default router
