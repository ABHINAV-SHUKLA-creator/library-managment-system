import { Router } from 'express'
import { getSettings, updateSettings } from '../controllers/settings.controllers.js'
import { verifyJWT } from '../middlewares/auth.middleware.js'
import { verifyRole } from '../middlewares/role.middleware.js'

const router = Router()

router.use(verifyJWT)

router.get('/', getSettings)
router.patch('/', verifyRole('admin'), updateSettings)

export default router
