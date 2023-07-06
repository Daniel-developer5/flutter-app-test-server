const serverless = require('serverless-http')
const express = require('express')
const app = express()
const fs = require('fs/promises')

const router = express.Router()

app.use(require('cors')())
app.use(express.json())

router.get('/', (_, res) => {
  res.send('Flutter Prawnik Test Server')
})

router.post('/message', async (req, res) => {
  const { body } = req
  
  try {
    await fs.writeFile('messages.json', JSON.stringify(body))
    res.send({ status: 200 })
  } catch (err) {
    console.error(err)
  }
})

app.use(`/.netlify/functions/api`, router)

const handler = serverless(app)
module.exports = { handler }