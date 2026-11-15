import { Router } from 'express'
import { borrowBook, returnBook, getMyBorrows, getAllBorrows } from '../controllers/borrow.controllers.js'
import { verifyJWT } from '../middlewares/auth.middleware.js'
import { verifyRole } from '../middlewares/role.middleware.js'

const router = Router()
const staff=verifyRole('employee', 'admin')

router.use(verifyJWT)


router.get('/my', getMyBorrows)  // student can see their own borrows
router.post('/issue', staff, borrowBook)
router.post('/return',staff, returnBook)
router.get('/', staff, getAllBorrows)

export default router
