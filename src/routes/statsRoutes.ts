import { Router } from 'express'

import {
  authenticateToken,
} from '../middleware/auth.ts'

import {
	getHabitHeatmap,
  getHabitStats,
} from '../controllers/statsController.ts'

const router = Router()

router.use(authenticateToken)

router.get(
  '/:habitId/stats',
  getHabitStats
)

router.get(
	'/:habitId/heatmap',
	getHabitHeatmap
)
export default router