import type { Response } from 'express'
import type { AuthenticatedRequest } from '../middleware/auth.ts'
import db, {} from '../db/connections.ts'
import { users } from '../db/schema.ts'
import { eq } from 'drizzle-orm'
import bcrypt from 'bcrypt'
import { error } from 'console'


export const getProfile =  async (req: AuthenticatedRequest, res: Response)=>{
	try{
		const userId = req.user!.id
		const [user] = await db
		.select({
			id: users.id,
			email: users.email,
			username: users.username,
			firstName: users.firstName,
			lastName: users.lastName,
			createdAt: users.createdAt,
			updatedAt: users.updatedAt,

		})
		.from(users)
		.where(eq(users.id, userId))


		if(!users){
			res.status(404).json({error:"User not found"})
		}

		res.json({user})
	}catch(e){
		console.error("Get profile error:", error)
		res.status(500).json({error: 'Failed to fetch profile'})
	}
}

export const updateProfile = async(req:AuthenticatedRequest, res: Response)=>{
	try{
		const [userId] = req.user!.id
		const {email, username, firstName, lastName} = req.body

		const [updatedUser]  = await db
		.update(users)
		.set({
			email,
			username,
			firstName,
			lastName,
			updatedAt: new Date()
		})
		.where(eq(users.id, userId))
		.returning({
			id: users.id,
			email: users.email,
			username: users.username,
			firstName: users.firstName,
			lastName: users.lastName,
			updatedAt: users.updatedAt,
		})

		res.json({
			message: 'Profile updated successfully',
			user: updatedUser
		})
	}catch(e){
		console.error('Updated profile error: ', e)
		res.status(500).json({error: 'Failed to update profile'})

	}
}

export const changePassword = async(req:AuthenticatedRequest, res:Response) =>{
	try{

		const userId = req.user!.id
		const {currentPassword, newPassword} = req.body

		const [user] = await db
		.select().from(users).where(eq(users.id, userId))

		if(!user){
			return res.status(404).json({error: "user not found"})
		}

		const isValidPassword =  await bcrypt.compare(currentPassword, user.password)

		if (!isValidPassword){
			return res.status(400).json({error: 'Current Password is incorrect'})
		}

		//hash new password
		const hashedPassword = await bcrypt.hash(newPassword, 10)
	// Update password
    await db
      .update(users)
      .set({
        password: hashedPassword,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))

    res.json({
      message: 'Password changed successfully',
    })
  } catch (error) {
    console.error('Change password error:', error)
    res.status(500).json({ error: 'Failed to change password' })
  }
}