import { Router } from 'express'

import {
  authenticateToken,
} from '../middleware/auth.ts'

import {
  getHabitStats,
} from '../controllers/statsController.ts'

const router = Router()

router.use(authenticateToken)

router.get(
  '/:habitId/stats',
  getHabitStats
)

export default router