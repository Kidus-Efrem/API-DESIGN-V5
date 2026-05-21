import type { Response } from 'express'
import type { AuthenticatedRequest } from '../middleware/auth.ts'

import { db } from '../db/connections.ts'

import {
  habits,
  habitTags,
  tags,
} from '../db/schema.ts'

import {
  eq,
  and,
  desc,
  inArray,
  ilike,

} from 'drizzle-orm'

import { AppError } from '../utils/AppError.ts'
import { error } from 'console'

// ================= CREATE HABIT =================
export const createHabit = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const {
      name,
      description,
      frequency,
      frequencyInterval,
      targetCount,
      tagIds,
    } = req.body

    const userId = req.user!.id

    const result = await db.transaction(async (tx) => {
      // Verify all tag IDs belong to user
      if (tagIds && tagIds.length > 0) {
        const userTags = await tx.query.tags.findMany({
          where: and(
            inArray(tags.id, tagIds),
            eq(tags.userId, userId)
          ),
        })

        if (userTags.length !== tagIds.length) {
          throw new AppError('INVALID_TAG_IDS', 400)
        }
      }

      // Create habit
      const [newHabit] = await tx
        .insert(habits)
        .values({
          userId,
          name,
          description,
          frequency,
          frequencyInterval,
          targetCount,
        })
        .returning()

      // Create habit-tag relationships
      if (tagIds && tagIds.length > 0) {
        const habitTagValues = tagIds.map(
          (tagId: string) => ({
            habitId: newHabit.id,
            tagId,
          })
        )

        await tx
          .insert(habitTags)
          .values(habitTagValues)
      }

      return newHabit
    })

    res.status(201).json({
      message: 'Habit created successfully',
      habit: result,
    })
  } catch (e) {
    if (e instanceof AppError) {
      return res.status(e.statusCode).json({
        error: e.message,
      })
    }

    console.error('create habit error:', e)

    res.status(500).json({
      error: 'Failed to create habit',
    })
  }
}

// ================= GET USER HABITS =================
export const getUserHabits = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {

    // =====================================
    // QUERY PARAMETERS
    // =====================================

    const {
      tagId,
      active,
      search,
      page = '1',
      limit = '10'
    } = req.query

    const pageNumber = Number(page)
    const limitNUmber = Number(limit)
    const offset = (pageNumber - 1) * limitNUmber

    // =====================================
    // BUILD DYNAMIC CONDITIONS
    // =====================================

    const conditions = [
      eq(habits.userId, req.user!.id)
    ]

    // Filter by active status
    // /api/habits?active=true

    if (active !== undefined) {

      conditions.push(
        eq(
          habits.isActive,
          active === 'true'
        )
      )
    }

    // Search by habit name
    // /api/habits?search=read

    if (search) {

      conditions.push(
        ilike(
          habits.name,
          `%${search}%`
        )
      )
    }

    // =====================================
    // FETCH HABITS
    // =====================================
    const totalHabits = await db.$count(habits, and(...conditions))
    
    const userHabitsWithTags =
      await db.query.habits.findMany({

        where: and(...conditions),

        limit:limitNUmber,
        offset,
        with: {
          habitTags: {
            with: {
              tag: true,
            },
          },
        },

        orderBy: [desc(habits.createdAt)],
      })

    // =====================================
    // TRANSFORM RESPONSE
    // =====================================

    const habitsWithTags =
      userHabitsWithTags.map((habit) => ({

        ...habit,

        tags: habit.habitTags.map(
          (ht) => ht.tag
        ),

        habitTags: undefined,
      }))

    // =====================================
    // OPTIONAL TAG FILTER
    // =====================================

    let filteredHabits = habitsWithTags

    // /api/habits?tagId=uuid

    if (tagId) {

      filteredHabits =
        habitsWithTags.filter(
          (habit) =>

            habit.tags.some(
              (tag) => tag.id === tagId
            )
        )
    }

    // =====================================
    // RESPONSE
    // =====================================

    res.json({
      page: pageNumber,
      limit: limitNUmber,
      total:totalHabits,
      totalpages:Math.ceil(totalHabits/limitNUmber),
      habits: filteredHabits,
    })

  } catch (e) {

    console.error('get habits error:', e)

    res.status(500).json({
      error: 'Failed to fetch habits',
    })
  }
}
// ================= UPDATE HABIT =================
export const updateHabit = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { id } = req.params
    const userId = req.user!.id

    const { tagIds, ...updates } = req.body

    const result = await db.transaction(async (tx) => {
      // Verify habit belongs to user
      const existingHabit =
        await tx.query.habits.findFirst({
          where: and(
            eq(habits.id, id),
            eq(habits.userId, userId)
          ),
        })

      if (!existingHabit) {
        throw new AppError(
          'Habit not found',
          404
        )
      }

      // Verify tags belong to user
      if (tagIds && tagIds.length > 0) {
        const userTags = await tx.query.tags.findMany({
          where: and(
            inArray(tags.id, tagIds),
            eq(tags.userId, userId)
          ),
        })

        if (userTags.length !== tagIds.length) {
          throw new AppError(
            'INVALID_TAG_IDS',
            400
          )
        }
      }

      // Update habit
      const [updatedHabit] = await tx
        .update(habits)
        .set({
          ...updates,
          updatedAt: new Date(),
        })
        .where(eq(habits.id, id))
        .returning()

      // Replace tags if provided
      if (tagIds !== undefined) {
        // Remove old tags
        await tx
          .delete(habitTags)
          .where(
            eq(habitTags.habitId, id)
          )

        // Insert new tags
        if (tagIds.length > 0) {
          const habitTagValues = tagIds.map(
            (tagId: string) => ({
              habitId: id,
              tagId,
            })
          )

          await tx
            .insert(habitTags)
            .values(habitTagValues)
        }
      }

      return updatedHabit
    })

    res.json({
      message: 'Habit updated successfully',
      habit: result,
    })
  } catch (e) {
    if (e instanceof AppError) {
      return res.status(e.statusCode).json({
        error: e.message,
      })
    }

    console.error('update habit error:', e)

    res.status(500).json({
      error: 'Failed to update habit',
    })
  }
}

// ================= DELETE HABIT =================
export const deleteHabit = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { id } = req.params
    const userId = req.user!.id

    const [deletedHabit] = await db
      .delete(habits)
      .where(
        and(
          eq(habits.id, id),
          eq(habits.userId, userId)
        )
      )
      .returning()

    if (!deletedHabit) {
      return res.status(404).json({
        error: 'Habit not found',
      })
    }

    res.json({
      message:
        'Habit deleted successfully',
    })
  } catch (e) {
    console.error(
      'delete habit error:',
      e
    )

    res.status(500).json({
      error: 'Failed to delete habit',
    })
  }
}
export const getUserHabit = async(req:AuthenticatedRequest  , res: Response)=>{

  try{
    const {id }  = req.params

    const userId = req.user!.id

    const habit = await db.query.habits.findFirst({
      where: and(
        eq(habits.id, id)
        ,eq(habits.userId, userId)
      ),
      with:{
        habitTags:{
          with:{
            tag:true
          }
        },
        reminders: true,
        dailyStats: true,

      }
    })
    if (!habit){
      return res.status(404).json({
        error: 'Habit not found'
      })
    }

    const formattedHabit = {
      ...habit,
      tags:
      habit.habitTags.map(
        (ht) =>ht.tag
      ),
      habitTags:undefined,
    }
    return res.json({
      habit:formattedHabit
    })
  }catch(e){
    console.error(
    'getHabitById error:',e)
    return res.status(500).json({
      error:
      'failed to fetch habit'
    })

  }
}