import type { Response } from 'express'
import type { AuthenticatedRequest } from '../middleware/auth.ts'

import { db } from '../db/connections.ts'
import { habitReminders, habits } from '../db/schema.ts'

import { and, eq } from 'drizzle-orm'
import { AppError } from '../utils/AppError.ts'

/* =========================================================
   CREATE REMINDER
========================================================= */
export const createReminder = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { habitId } = req.params
    const userId = req.user!.id

    const {
      timeMinutes,
      timeZone,
      daysOfWeek,
      frequency,
      frequencyInterval,
    } = req.body

    const result = await db.transaction(async (tx) => {
      // 1. Verify ownership of habit
      const habit = await tx.query.habits.findFirst({
        where: and(
          eq(habits.id, habitId),
          eq(habits.userId, userId)
        ),
      })

      if (!habit) {
        throw new AppError('Habit not found', 404)
      }

      // 2. Create reminder
      const [reminder] = await tx
        .insert(habitReminders)
        .values({
          habitId,
          timeMinutes,
          timeZone,
          daysOfWeek: daysOfWeek ?? [],
          frequency,
          frequencyInterval,
          enabled: true,
        })
        .returning()

      return reminder
    })

    return res.status(201).json({
      message: 'Reminder created',
      reminder: result,
    })
  } catch (e) {
    if (e instanceof AppError) {
      return res.status(e.statusCode).json({
        error: e.message,
      })
    }

    console.error('createReminder error:', e)
    return res.status(500).json({
      error: 'Failed to create reminder',
    })
  }
}

/* =========================================================
   GET ALL REMINDERS FOR A HABIT
========================================================= */
export const getHabitReminders = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { habitId } = req.params
    const userId = req.user!.id

    const reminders = await db.query.habitReminders.findMany({
      where: and(
        eq(habitReminders.habitId, habitId)
      ),
      orderBy: (r, { desc }) => [desc(r.createdAt)],
    })

    // optional safety check (ensures habit belongs to user)
    const habit = await db.query.habits.findFirst({
      where: and(
        eq(habits.id, habitId),
        eq(habits.userId, userId)
      ),
    })

    if (!habit) {
      throw new AppError('Habit not found', 404)
    }

    return res.json({
      reminders,
    })
  } catch (e) {
    if (e instanceof AppError) {
      return res.status(e.statusCode).json({
        error: e.message,
      })
    }

    console.error('getHabitReminders error:', e)
    return res.status(500).json({
      error: 'Failed to fetch reminders',
    })
  }
}

/* =========================================================
   UPDATE REMINDER
========================================================= */
export const updateReminder = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { id } = req.params
    const userId = req.user!.id

    const updates = req.body

    const result = await db.transaction(async (tx) => {
      const reminder = await tx.query.habitReminders.findFirst({
        where: eq(habitReminders.id, id),
        with: {
          habit: true,
        },
      })

      if (!reminder || reminder.habit.userId !== userId) {
        throw new AppError('Reminder not found', 404)
      }

      const [updated] = await tx
        .update(habitReminders)
        .set({
          ...updates,
          updatedAt: new Date(),
        })
        .where(eq(habitReminders.id, id))
        .returning()

      return updated
    })

    return res.json({
      message: 'Reminder updated',
      reminder: result,
    })
  } catch (e) {
    if (e instanceof AppError) {
      return res.status(e.statusCode).json({
        error: e.message,
      })
    }

    console.error('updateReminder error:', e)
    return res.status(500).json({
      error: 'Failed to update reminder',
    })
  }
}

/* =========================================================
   DELETE REMINDER
========================================================= */
export const deleteReminder = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { id } = req.params
    const userId = req.user!.id

    const result = await db.transaction(async (tx) => {
      const reminder = await tx.query.habitReminders.findFirst({
        where: eq(habitReminders.id, id),
        with: {
          habit: true,
        },
      })

      if (!reminder || reminder.habit.userId !== userId) {
        throw new AppError('Reminder not found', 404)
      }

      const [deleted] = await tx
        .delete(habitReminders)
        .where(eq(habitReminders.id, id))
        .returning()

      return deleted
    })

    return res.json({
      message: 'Reminder deleted',
      reminder: result,
    })
  } catch (e) {
    if (e instanceof AppError) {
      return res.status(e.statusCode).json({
        error: e.message,
      })
    }

    console.error('deleteReminder error:', e)
    return res.status(500).json({
      error: 'Failed to delete reminder',
    })
  }
}

/* =========================================================
   TOGGLE REMINDER
========================================================= */
export const toggleReminder = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { id } = req.params
    const userId = req.user!.id

    const result = await db.transaction(async (tx) => {
      const reminder = await tx.query.habitReminders.findFirst({
        where: eq(habitReminders.id, id),
        with: {
          habit: true,
        },
      })

      if (!reminder || reminder.habit.userId !== userId) {
        throw new AppError('Reminder not found', 404)
      }

      const [updated] = await tx
        .update(habitReminders)
        .set({
          enabled: !reminder.enabled,
          updatedAt: new Date(),
        })
        .where(eq(habitReminders.id, id))
        .returning()

      return updated
    })

    return res.json({
      message: 'Reminder toggled',
      reminder: result,
    })
  } catch (e) {
    if (e instanceof AppError) {
      return res.status(e.statusCode).json({
        error: e.message,
      })
    }

    console.error('toggleReminder error:', e)
    return res.status(500).json({
      error: 'Failed to toggle reminder',
    })
  }
}