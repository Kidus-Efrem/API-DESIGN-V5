import express from 'express'
const app = express()
app.get('/health', (req, res) => {
	res.send('<button>click</click>')
})
app.post('/cake', (req, res)=>{
	res.send("<h1>here is your cake</h1>")
})
export {app}
export default app