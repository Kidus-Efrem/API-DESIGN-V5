import { Router } from 'express'
import { z } from 'zod'

import {
  validateBody,
  validateParams,
} from '../middleware/validation.ts'

import { authenticateToken } from '../middleware/auth.ts'

import {
  createReminder,
  getHabitReminders,
  updateReminder,
  deleteReminder,
  toggleReminder,
} from '../controllers/reminderController.ts'

const router = Router()

/* =========================================================
   AUTH
========================================================= */

router.use(authenticateToken)

/* =========================================================
   VALIDATION SCHEMAS
========================================================= */

const uuidParamSchema = z.object({
  id: z.uuid(),
})

const habitIdParamSchema = z.object({
  habitId: z.uuid(),
})

const createReminderSchema = z.object({
  timeMinutes: z
    .number()
    .int()
    .min(0)
    .max(1439),

  timeZone: z
    .string()
    .min(1),

  daysOfWeek: z
    .array(
      z.number().int().min(0).max(6)
    )
    .optional(),

  frequency: z.enum([
    'daily',
    'weekly',
    'monthly',
  ]),

  frequencyInterval: z
    .number()
    .int()
    .min(1),
})

const updateReminderSchema =
  createReminderSchema.partial().extend({
    enabled: z.boolean().optional(),
  })

/* =========================================================
   ROUTES
========================================================= */

/*
  Create reminder for a habit
  POST /habits/:habitId/reminders
*/
router.post(
  '/habits/:habitId/reminders',

  validateParams(habitIdParamSchema),

  validateBody(createReminderSchema),

  createReminder
)

/*
  Get reminders for a habit
  GET /habits/:habitId/reminders
*/
router.get(
  '/habits/:habitId/reminders',

  validateParams(habitIdParamSchema),

  getHabitReminders
)

/*
  Update reminder
  PATCH /reminders/:id
*/
router.patch(
  '/reminders/:id',

  validateParams(uuidParamSchema),

  validateBody(updateReminderSchema),

  updateReminder
)

/*
  Toggle reminder enabled/disabled
  PATCH /reminders/:id/toggle
*/
router.patch(
  '/reminders/:id/toggle',

  validateParams(uuidParamSchema),

  toggleReminder
)

/*
  Delete reminder
  DELETE /reminders/:id
*/
router.delete(
  '/reminders/:id',

  validateParams(uuidParamSchema),

  deleteReminder
)

export default router