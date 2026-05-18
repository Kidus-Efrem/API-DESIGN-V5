import type { Response } from 'express'
import type { AuthenticatedRequest } from '../middleware/auth.ts'

import { db } from '../db/connections.ts'

import {
  habits,
  entries,
  habitDailyStats,
} from '../db/schema.ts'

import {
  and,
  eq,
  sql,
} from 'drizzle-orm'

import { AppError } from '../utils/AppError.ts'

export const createEntry = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { habitId } = req.params

    const incrementBy =
      Number(req.body.count) || 1

    const userId = req.user!.id

    if (incrementBy <= 0) {
      throw new AppError(
        'Count must be greater than 0',
        400
      )
    }

    const result = await db.transaction(
      async (tx) => {

        // ==============================
        // 1. Verify habit ownership
        // ==============================

        const habit = await tx.query.habits.findFirst({
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

        // ==============================
        // 2. Normalize today's date
        // ==============================

        const today = new Date()

        today.setHours(0, 0, 0, 0)

        // ==============================
        // 3. Check existing entry
        // ==============================

        const existingEntry =
          await tx.query.entries.findFirst({
            where: and(
              eq(entries.habitId, habitId),
              eq(entries.date, today)
            )
          })

        let updatedCount = incrementBy
        let previousCount = 0

        // ==============================
        // 4. Update OR create entry
        // ==============================

        if (existingEntry) {

          previousCount = existingEntry.count

          updatedCount =
            existingEntry.count + incrementBy

          await tx
            .update(entries)
            .set({
              count: updatedCount
            })
            .where(eq(entries.id, existingEntry.id))

        } else {

          await tx
            .insert(entries)
            .values({
              habitId,
              date: today,
			  completionDate: new Date(),
              count: incrementBy
            })

        }

        // ==============================
        // 5. Determine completion state
        // ==============================

        const wasCompletedBefore =
          previousCount >= habit.targetCount

        const isCompletedNow =
          updatedCount >= habit.targetCount

        // ==============================
        // 6. Upsert daily stats
        // ==============================

        const existingDailyStat =
          await tx.query.habitDailyStats.findFirst({
            where: and(
              eq(habitDailyStats.habitId, habitId),
              eq(habitDailyStats.date, today)
            )
          })

        if (existingDailyStat) {

          await tx
            .update(habitDailyStats)
            .set({
              completionCount: updatedCount,
              updatedAt: new Date()
            })
            .where(
              eq(
                habitDailyStats.id,
                existingDailyStat.id
              )
            )

        } else {

          await tx
            .insert(habitDailyStats)
            .values({
              habitId,
              date: today,
              completionCount: updatedCount,
              targetCount: habit.targetCount
            })

        }

        // ==============================
        // 7. Update streak ONLY when
        //    habit becomes completed
        // ==============================

        if (
          !wasCompletedBefore &&
          isCompletedNow
        ) {

          const newCurrentStreak =
            habit.currentStreak + 1

          const newLongestStreak =
            Math.max(
              newCurrentStreak,
              habit.longestStreak
            )

          await tx
            .update(habits)
            .set({
              currentStreak:
                newCurrentStreak,

              longestStreak:
                newLongestStreak,

              updatedAt: new Date()
            })
            .where(eq(habits.id, habitId))
        }

        // ==============================
        // 8. Return response data
        // ==============================

        return {
          count: updatedCount,
          target: habit.targetCount,
          completed: isCompletedNow
        }
      }
    )

    res.status(201).json({
      message: 'Entry created',
      progress: result
    })

  } catch (e) {

    if (e instanceof AppError) {
      return res.status(e.statusCode).json({
        error: e.message
      })
    }

    console.error('create entry error:', e)

    res.status(500).json({
      error: 'Failed to create entry'
    })
  }
}