import type { Response } from 'express'
import type { AuthenticatedRequest } from '../middleware/auth.ts'

import { db } from '../db/connections.ts'

import {
  habits,
  habitTags,
  tags,
  entries
} from '../db/schema.ts'

import {
  eq,
  and,
  desc,
  inArray,
} from 'drizzle-orm'

import { AppError } from '../utils/AppError.ts'

// ================= CREATE Entry =================
export const createEntry = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
	const {
	  id,
	 habitId

	} = req.params

	const incrementBy = Number(req.body.count) ||1
	if (incrementBy <= 0){
		throw new AppError(
			'Count must be greater than 0',
			400
		)
	}

	const userId = req.user!.id

	const result = await db.transaction(
		async (tx) => {

			const habit = await tx.query.habits.findFirst({
				where :  and(
					eq(habits.id, habitId),
					eq(habits.userId, userId)

				)}
			)
	  if (!habit){
		throw new AppError(
			"habit not found", 404
		)

	  }

		const today = new Date()
		today.setHours( 0 , 0 , 0 , 0)


		const existingEntry = await tx.query.entries.findFirst({
			where: and(
				eq(entries.habitId, habitId),
				eq(entries.completionDate, today)
			)

		})

		let updatedCount = incrementBy
		let previousCount = 0

		if (existingEntry){
			previousCount = existingEntry.count
			updatedCount  = existingEntry.count + incrementBy

			await tx.update(entries).set({
				count:updatedCount
			}).where(eq(entries.id, existingEntry.id))
		}

		else{
			 await tx
            .insert(entries)
            .values({
              habitId,
              completionDate: today,
              count: incrementBy
            })
		}


}
