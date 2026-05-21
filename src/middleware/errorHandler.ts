import type {
  Request,
  Response,
  NextFunction,
} from 'express'
import { AppError }
  from '../utils/AppError.ts'
import { ZodError } from 'zod'

export const errorHandler = (
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction
) => {
 if (err instanceof AppError){

	return res.status(err.statusCode).json({
		error:err.message
	})
  }

  if (err instanceof ZodError){
	return res.status(400).json({
		error: 'Validation failed',
		details: err.issues.map((issues)=>({
			field:issues.path.join('.'),
			message: issues.message
		}))
	})
  }
  console.error(err)


  return res.status(500).json({
    error: 'Internal server error',
  })
}