import type { Response } from 'express'
import type { AuthenticatedRequest } from '../middleware/auth.ts'

import { db } from '../db/connections.ts'

import {
  habits,
  entries,
} from '../db/schema.ts'

import {
  and,
  eq,
  sql,
  gte,
  lte
} from 'drizzle-orm'

import { AppError } from '../utils/AppError.ts'

export const getHabitStats = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {

    const { habitId } = req.params
    const userId = req.user!.id

    // =====================================
    // 1. Verify habit ownership
    // =====================================

    const habit = await db.query.habits.findFirst({
      where: and(
        eq(habits.id, habitId),
        eq(habits.userId, userId)
      )
    })

    if (!habit) {
      throw new AppError(
        'Habit not found',
        404
      )
    }

    // =====================================
    // 2. Normalize today
    // =====================================

    const today = new Date()

    today.setHours(0, 0, 0, 0)

    // =====================================
    // 3. Get today's entry
    // =====================================

    const todayEntry =
      await db.query.entries.findFirst({
        where: and(
          eq(entries.habitId, habitId),
          eq(entries.date, today)
        )
      })

    // =====================================
    // 4. Calculate total completions
    // =====================================

    const totalResult = await db
      .select({
        total:
          sql<number>`
            COALESCE(SUM(${entries.count}), 0)
          `
      })
      .from(entries)
      .where(
        eq(entries.habitId, habitId)
      )

    const totalCompletions =
      totalResult[0]?.total || 0

    // =====================================
    // 5. Calculate completion rate
    // =====================================

    // total completed days
    const completedDaysResult = await db
      .select({
        total:
          sql<number>`
            COUNT(*)
          `
      })
      .from(entries)
      .where(
        and(
          eq(entries.habitId, habitId),
          sql`${entries.count} >= ${habit.targetCount}`
        )
      )

    const completedDays =
      completedDaysResult[0]?.total || 0

    // days since habit creation
    const createdAt =
      new Date(habit.createdAt)

    const now = new Date()

    const totalDays =
      Math.max(
        1,
        Math.ceil(
          (
            now.getTime() -
            createdAt.getTime()
          ) /
          (1000 * 60 * 60 * 24)
        )
      )

    const completionRate =
      Math.round(
        (completedDays / totalDays) * 100
      )

    // =====================================
    // 6. Build response
    // =====================================

    return res.json({

      habitId,

      currentStreak:
        habit.currentStreak,

      longestStreak:
        habit.longestStreak,

      today: {

        count:
          todayEntry?.count || 0,

        target:
          habit.targetCount,

        completed:
          (todayEntry?.count || 0)
          >= habit.targetCount
      },

      totalCompletions,

      completionRate,
    })

  } catch (e) {

    if (e instanceof AppError) {
      return res.status(e.statusCode).json({
        error: e.message
      })
    }

    console.error(
      'getHabitStats error:',
      e
    )

    return res.status(500).json({
      error:
        'Failed to fetch stats'
    })
  }
}

export const getHabitHeatmap = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {

    const { habitId } = req.params

    const userId = req.user!.id

    // =====================================
    // 1. Verify habit ownership
    // =====================================

    const habit =
      await db.query.habits.findFirst({
        where: and(
          eq(habits.id, habitId),
          eq(habits.userId, userId)
        )
      })

    if (!habit) {
      throw new AppError(
        'Habit not found',
        404
      )
    }

    // =====================================
    // 2. Define range
    // last 30 days
    // =====================================

    const endDate = new Date()

    endDate.setHours(0, 0, 0, 0)

    const startDate = new Date()

    startDate.setDate(
      startDate.getDate() - 29
    )

    startDate.setHours(0, 0, 0, 0)

    // =====================================
    // 3. Fetch entries
    // =====================================

    const habitEntries =
      await db
        .select({
          date: entries.date,
          count: entries.count,
        })
        .from(entries)
        .where(
          and(
            eq(entries.habitId, habitId),

            gte(
              entries.date,
              startDate
            ),

            lte(
              entries.date,
              endDate
            )
          )
        )

    // =====================================
    // 4. Convert to lookup map
    // =====================================

    const entryMap =
      new Map<string, number>()

    for (const entry of habitEntries) {

      const key =
        new Date(entry.date)
          .toISOString()
          .split('T')[0]

      entryMap.set(
        key,
        (entryMap.get(key) || 0)
        + entry.count
      )
    }

    // =====================================
    // 5. Fill missing days
    // IMPORTANT FOR UI
    // =====================================

    const data = []

    for (let i = 0; i < 30; i++) {

      const currentDate =
        new Date(startDate)

      currentDate.setDate(
        currentDate.getDate() + i
      )

      const key =
        currentDate
          .toISOString()
          .split('T')[0]

      data.push({
        date: key,
        count:
          entryMap.get(key) || 0,
      })
    }

    // =====================================
    // 6. Return
    // =====================================

    return res.json({
      habitId,
      data,
    })

  } catch (e) {

    if (e instanceof AppError) {
      return res.status(e.statusCode).json({
        error: e.message,
      })
    }

    console.error(
      'getHabitHeatmap error:',
      e
    )

    return res.status(500).json({
      error:
        'Failed to fetch heatmap',
    })
  }
}