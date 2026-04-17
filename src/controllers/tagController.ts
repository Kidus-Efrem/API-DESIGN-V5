import type { Response } from 'express'
import type { AuthenticatedRequest } from '../middleware/auth.ts'
import { db } from '../db/connections.ts'
import { tags } from '../db/schema.ts'
import { eq, and, desc } from 'drizzle-orm'

export const createTag = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { name, color } = req.body
    const userId = req.user!.id

    const existingTag = await db.query.tags.findFirst({
      where: and(
        eq(tags.name, name),
        eq(tags.userId, userId)
      ),
    })

    if (existingTag) {
      return res.status(409).json({
        error: 'Tag with this name already exists',
      })
    }

    const [newTag] = await db
      .insert(tags)
      .values({
        name,
        color: color || '#6B7280',
        userId,
      })
      .returning()

    res.status(201).json({
      message: 'Tag created successfully',
      tag: newTag,
    })
  } catch (e) {
    console.error('Create tag error:', e)
    res.status(500).json({ error: 'Failed to create tag' })
  }
}

export const getUserTags = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.id

    const userTags = await db.query.tags.findMany({
      where: eq(tags.userId, userId),
      orderBy: [desc(tags.createdAt)],
    })

    res.json({
      tags: userTags,
    })
  } catch (e) {
    console.error('Get tags error:', e)
    res.status(500).json({ error: 'Failed to fetch tags' })
  }
}

export const updateTag = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params
    const { name, color } = req.body
    const userId = req.user!.id

    const [updatedTag] = await db
      .update(tags)
      .set({
        name,
        color,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(tags.id, id),
          eq(tags.userId, userId)
        )
      )
      .returning()

    if (!updatedTag) {
      return res.status(404).json({
        error: 'Tag not found',
      })
    }

    res.json({
      message: 'Tag updated successfully',
      tag: updatedTag,
    })
  } catch (e) {
    console.error('Update tag error:', e)
    res.status(500).json({ error: 'Failed to update tag' })
  }
}

export const deleteTag = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params
    const userId = req.user!.id

    const [deletedTag] = await db
      .delete(tags)
      .where(
        and(
          eq(tags.id, id),
          eq(tags.userId, userId)
        )
      )
      .returning()

    if (!deletedTag) {
      return res.status(404).json({
        error: 'Tag not found',
      })
    }

    res.json({
      message: 'Tag deleted successfully',
    })
  } catch (e) {
    console.error('Delete tag error:', e)
    res.status(500).json({ error: 'Failed to delete tag' })
  }
}