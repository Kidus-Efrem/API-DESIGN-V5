import type {Response} from 'express'
import  type {AuthenticatedRequest} from '../middleware/auth.ts'
import {db} from '../db/connections.ts'
import {habits, entries, habitTags, tags} from '../db/schema.ts'
import { eq, and, desc, inArray } from 'drizzle-orm'
import { error } from 'console'
import { DefaultDeserializer } from 'v8'

export const createHabit = async(req: AuthenticatedRequest ,res : Response) =>{
try{

	const {name , description , frequency,frequencyInterval,
		 targetCount, tagIds} = req.body
	const userId = req.user!.id
	const result  = await db.transaction(async (tx) =>{
		const [newHabit] = await tx
		.insert(habits)
		.values({
			userId,
			name,
			description,
			frequencyInterval,
			frequency,
			targetCount
		}).returning()
		if (tagIds && tagIds.length > 0){
			const userTags = await tx.query.tags.findMany({
				where: and(
					inArray(tags.id, tagIds)
					,eq(tags.userId, userId)
				)
			})
			if (userTags.length != tagIds){
				throw new Error('INVALID_TAG_IDS')
			}
			const habitTagValues = tagIds.map((tagId: string) =>({
				habitId: newHabit.id,
				tagId
			}))
			await tx.insert(habitTags).values(habitTagValues)

		}
		return newHabit
	})

	res.status(201).json({
		message:"Habit Created",
		habit: result
	})
}catch (e){
	if (e instanceof Error && e.message ==='INVALID_TAG_IDS'){
		return res.status(400).json({
			error:'One or more tags do not belong to this user'
		})

	}

	console.error("create habit error", e)
	res.status(500).json({"error":"Failed to create habit" })

}
}

export const getUserHabits = async(req: AuthenticatedRequest , res: Response)=>{
	try{
		const userHabitsWithTags = await db.query.habits.findMany({
			where: eq(habits.userId, req.user!.id),
			with: {
				habitTags:{
					with:{
						tag: true,

					}
				}
			},
			orderBy: [desc(habits.createdAt)]


		})

		const habitWithTags = userHabitsWithTags.map(habit=>({
			...habit,
			tags:habit.habitTags.map((ht)=>ht.tag),
			habitTags:undefined
		}))
		res.json({
			habit:habitWithTags
		})
	}catch(e){
		console.error("get habits error", e)
		res.status(500).json({"error":"Failed to fetch habit" })

	}
}

export const updateHabit = async(req: AuthenticatedRequest, res: Response)=>{
	try{
		const id = req.params.id
		const {tagIds, ...updates} = req.body

		const result  = await db.transaction(async (tx)=>{
		const [updateHabit] = await tx
		.update(habits)
		.set({...updates, updateAt:new Date()})
		.where(and(eq(habits.id,id), eq(habits.userId, req.user!.id))).returning()


		if (!updateHabit){
			throw new Error('Habit not found')
		}

		if(tagIds !== undefined){
			await tx.delete(habitTags).where(eq(habitTags.habitId, req.params.id))

		}

		if (tagIds && tagIds.length > 0){
			const habitTagsvalues = tagIds.map((tagId: string)=>({
				habitTags: req.params.id,
				tagId
			}))
			await tx.insert(habitTags).values(habitTagsvalues)
		}
		return updateHabit
		})

		res.json({
			message: 'habit was updated',
			habit: result
		})
	}catch(e: any){
		if (e.message === 'Habit not found'){
		return res.status(404).json({ error: 'Habit not found' })
		}
		console.error('update habit error :', e)
		res.status(500).json({error: 'Failed to update habit'})
	}
}

export const deleteHabit = async(req: AuthenticatedRequest, res : Response) =>{
	try{
		const {id} = req.params
		const userId = req.user!.id

		const [deleteHabit] = await db
		.delete(habits)
		.where(and(eq(habits.id, id), eq(habits.userId, userId)))
		.returning()

		if (!deleteHabit){
			return res.status(404).json({error: "Habit not found"})
		}

		res.json({
			message: "Habit delted successfully"
		})

	}catch(e){

		console.error("Delete habit error : ", e)
		res.status(500).json({error: "Failed to delete habit"})
	}
}