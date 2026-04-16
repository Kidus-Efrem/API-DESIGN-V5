import type { Request, Response } from 'express'
import type { AuthenticatedRequest } from '../middleware/auth.ts'
import { db } from '../db/connections.ts'
import { tags, habitTags } from '../db/schema.ts'
import { eq, desc } from 'drizzle-orm'

export const createTag = async(req: AuthenticatedRequest, res: Response) =>{
	try{const {name, color} = req.body

	const exisitingTag = await db.query.tags
	.findFirst({
		where: eq(tags.name , name)
	})

	if (exisitingTag){
		return res.status(409).json({
			error: "Tag with this name already exists"
		})}

	const [newTag] = await db.insert(tags).values({
		name,
		color : color|| '#6B7280'
	}).returning()

	res.status(201).json({
		message:"Tag created successfully",
		tag: newTag
	})}catch(e){
		console.error("create tag error", e)
		res.status(500).json({error: "Failed to create Tag"})


	}


}

export const deleteTag = async(req:AuthenticatedRequest, res: Response)=>{
	try{
		userId = 

	}catch(e){

	}
}