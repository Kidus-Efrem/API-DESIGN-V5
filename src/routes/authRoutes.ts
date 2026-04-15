import { Router } from 'express'
import { login, register } from '../controllers/authControllers.ts'
import { validateBody } from '../middleware/validation.ts'
import { z } from 'zod'
import { insertUserSchema } from '../db/schema.ts'
const loginSchema = z.object({
	email:z.email('Invalid email'),
	password: z.string().min(1, 'password is required')
})
const router = Router()

router.post('/register', validateBody(insertUserSchema), register)
router.post('/login', validateBody(loginSchema), login)
export default router