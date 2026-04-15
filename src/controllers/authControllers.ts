import type { Request, Response } from 'express'
import bcrypt from 'bcrypt'
import { generateToken } from '../utils/jwt.ts'
import { db } from '../db/connections.ts'
import { users } from '../db/schema.ts'
import { eq} from 'drizzle-orm'
import { comparePassword } from '../utils/password.ts'

export const register = async (req: Request, res: Response) => {
  try {
    const { email, username, password, firstName, lastName } = req.body

    // Hash password with configurable rounds
    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS || '12')
    const hashedPassword = await bcrypt.hash(password, saltRounds)

    // Create user in database
    const [newUser] = await db
      .insert(users)
      .values({
        email,
        username,
        password: hashedPassword,  // Store hash, not plain text!
        firstName,
        lastName,
      })
      .returning({
        id: users.id,
        email: users.email,
        username: users.username,
        firstName: users.firstName,
        lastName: users.lastName,
        createdAt: users.createdAt,
      })

    // Generate JWT for auto-login
    const token = await generateToken({
      id: newUser.id,
      email: newUser.email,
      username: newUser.username,
    })

    res.status(201).json({
      message: 'User created successfully',
      user: newUser,
      token,  // User is logged in immediately
    })
  } catch (error) {
    console.error('Registration error:', error)
    res.status(500).json({ error: 'Failed to create user' })
  }
}

export const login  = async(req: Request, res : Response) =>
{
  try{
    const {email, password} = req.body
    const user = await db.query.users.findFirst({
      where: eq(users.email, email),
    })
    if(!user){
      return res.status(401).json({error: 'Invalid credentials'})
    }
    const isValidatedPassword = await comparePassword(password, user.password)

    if(!isValidatedPassword){
      return res.status(401).json({error: "Invalid credentials"})
    }

    const token = await generateToken({id:user.id,  email:user.email, username:user.username })

    return res.json({
      message: 'login successfull',
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        createdAt: user.createdAt,
      },
      token: token
    }).status(201)

  }
  catch(e){
    console.error('loging error', e)
    res.status(500).json({error: 'Failed to login'})
  }
}