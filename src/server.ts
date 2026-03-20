import express from 'express'
const app = express()
app.get('/health', (req, res) => {
	res.send('<button>click</click>')
})
export {app}
export default app