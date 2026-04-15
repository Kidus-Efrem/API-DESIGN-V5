import { Router } from 'express'
import {z} from 'zod'
import { validateBody, validateParams } from '../middleware/validation.ts'
import { authenticateToken } from '../middleware/auth.ts'
import { createHabit, deleteHabit, getUserHabits, updateHabit } from '../controllers/habitController.ts'
const router = Router()

const createHabitSchema = z.object({
  name: z.string(),
  description : z.string().optional(),
  frequency: z.string(),
  targetCount: z.number(),
  tagIds: z.array(z.string()).optional()

})
// Habit-specific routes

router.use( authenticateToken)
router.get('/', getUserHabits)
const deleteHabitSchema = z.object({id:z.number()})
router.post('/',validateBody(createHabitSchema), createHabit)

// Habit completion routes
router.post('/:id/complete', (req, res) => {
  res.json({ message: `Mark habit ${req.params.id} complete` })
})
router.patch('/:id', updateHabit)

router.get('/:id/stats', (req, res) => {
  res.json({ message: `Get stats for habit ${req.params.id}` })

})
router.delete('/:id', deleteHabit)

export default router