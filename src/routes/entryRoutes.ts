import { Router } from 'express'
import { z } from 'zod'

import { authenticateToken } from '../middleware/auth.ts'

import {
  validateBody,
  validateParams,
  validateQuery,
} from '../middleware/validation.ts'

import {
  createEntry,
} from '../controllers/entryController.ts'

const router = Router()

// ========================================
// Apply authentication to all routes
// ========================================

router.use(authenticateToken)

// ========================================
// Validation Schemas
// ========================================

const habitIdParamSchema = z.object({
  habitId: z.uuid(),
})

const createEntrySchema = z.object({
  count: z
    .number()
    .int()
    .positive()
    .optional(),

  note: z
    .string()
    .max(500)
    .optional(),
})

// ========================================
// Routes
// ========================================

// Create or increment today's entry
router.post(
  '/:habitId',
  validateParams(habitIdParamSchema),
  validateBody(createEntrySchema),
  createEntry
)

export default router