import {Router} from 'express'

const router = Router()

router.get('/', (req, res) =>{
	res.json({message:'habbits'})
})

router.get('/:id', (req, res)=>{
	res.json({message:'got one habbit'})
})

router.post('/', (req, res)=>{
	res.json({message:'created habbit'})
})

router.delete("/:id", (req, res) =>{
	res.json({message:"delte habbit"})
})
router.post("/:id/complete", (req, res)=>{
	res.json({message: 'completed habit'})
})

export default router