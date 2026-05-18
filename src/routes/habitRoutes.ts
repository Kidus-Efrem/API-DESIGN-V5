import { Router } from 'express'
import { z } from 'zod'

import {
  validateBody,
  validateParams,
} from '../middleware/validation.ts'

import {
  authenticateToken,
} from '../middleware/auth.ts'

import {
  createHabit,
  deleteHabit,
  getUserHabits,
  updateHabit,
} from '../controllers/habitController.ts'
import { createEntry } from '../controllers/entryController.ts'
const router = Router()

/* =========================================================
   PARAM SCHEMAS
========================================================= */

const habitIdParamSchema = z.object({
  id: z.uuid(),
})

/* =========================================================
   CREATE HABIT SCHEMA
========================================================= */

const createHabitSchema = z.object({
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name too long'),

  description: z
    .string()
    .max(1000, 'Description too long')
    .optional(),

  frequency: z.enum([
    'daily',
    'weekly',
    'monthly',
  ]),

  frequencyInterval: z
    .number()
    .int()
    .positive()
    .optional(),

  targetCount: z
    .number()
    .int()
    .positive()
    .optional(),

  tagIds: z
    .array(z.uuid())
    .optional(),
})

/* =========================================================
   UPDATE HABIT SCHEMA
========================================================= */

const updateHabitSchema =
  createHabitSchema.partial()

/* =========================================================
   AUTH MIDDLEWARE
========================================================= */

router.use(authenticateToken)

/* =========================================================
   ROUTES
========================================================= */

/* -------------------------
   GET USER HABITS
------------------------- */

router.get(
  '/',
  getUserHabits
)

/* -------------------------
   CREATE HABIT
------------------------- */

router.post(
  '/',
  validateBody(createHabitSchema),
  createHabit
)

router.post(
  '/:habitId/entries',
  createEntry
)

/* -------------------------
   UPDATE HABIT
------------------------- */

router.patch(
  '/:id',
  validateParams(habitIdParamSchema),
  validateBody(updateHabitSchema),
  updateHabit
)

/* -------------------------
   DELETE HABIT
------------------------- */

router.delete(
  '/:id',
  validateParams(habitIdParamSchema),
  deleteHabit
)

export default router