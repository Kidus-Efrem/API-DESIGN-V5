import { Router } from 'express'
import { z } from 'zod'

import {
  createTag,
  getUserTags,
  updateTag,
  deleteTag,
} from '../controllers/tagController.ts'

import {
  validateBody,
  validateParams,
} from '../middleware/validation.ts'

import { authenticateToken } from '../middleware/auth.ts'

const router = Router()

// ================= PARAM SCHEMA =================

const tagIdParamSchema = z.object({
  id: z.uuid(),
})

// ================= CREATE TAG =================

const createTagSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Tag name is required')
    .max(50, 'Tag name too long'),

  color: z
    .string()
    .regex(
      /^#([0-9A-Fa-f]{6})$/,
      'Invalid hex color'
    )
    .optional(),
})

// ================= UPDATE TAG =================

const updateTagSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1)
    .max(50)
    .optional(),

  color: z
    .string()
    .regex(
      /^#([0-9A-Fa-f]{6})$/,
      'Invalid hex color'
    )
    .optional(),
})

// ================= AUTH =================

router.use(authenticateToken)

// ================= ROUTES =================

// GET /tags
router.get('/', getUserTags)

// POST /tags
router.post(
  '/',
  validateBody(createTagSchema),
  createTag
)

// PATCH /tags/:id
router.patch(
  '/:id',
  validateParams(tagIdParamSchema),
  validateBody(updateTagSchema),
  updateTag
)

// DELETE /tags/:id
router.delete(
  '/:id',
  validateParams(tagIdParamSchema),
  deleteTag
)

export default router