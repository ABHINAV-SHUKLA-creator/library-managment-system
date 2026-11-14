import { Router } from 'express'
import { borrowBook, returnBook, getMyBorrows } from '../controllers/borrow.controllers.js'
import { verifyJWT } from '../middlewares/auth.middleware.js'
import { verifyRole } from '../middlewares/role.middleware.js'

const router = Router()
const staff=verifyRole('employee', 'admin')

router.use(verifyJWT)

router.post('/issue', staff, borrowBook)
router.post('/return',staff, returnBook)
router.get('/my',staff, getMyBorrows) 

export default router
