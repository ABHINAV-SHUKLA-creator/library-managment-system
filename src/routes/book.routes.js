import { Router } from 'express'
import {
    allBooks, getById, getByCategory, addBook, updateBook, removeBook, addCopies,
} from '../controllers/book.controllers.js'
import { verifyJWT } from '../middlewares/auth.middleware.js'
import { verifyRole } from '../middlewares/role.middleware.js'

const router = Router()
const staff = verifyRole('employee', 'admin')

router.use(verifyJWT)

router.get('/', allBooks)
router.get('/category/:category', getByCategory) // must be above '/:id'
router.get('/:id', getById)

router.post('/', staff, addBook)
router.post('/:id/copies', staff, addCopies)
router.patch('/:id', staff, updateBook)
router.delete('/:id', staff, removeBook)

export default router
