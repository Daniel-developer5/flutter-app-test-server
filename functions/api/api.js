const serverless = require('serverless-http')
const express = require('express')
const app = express()

const router = express.Router()

app.use(require('cors')())
app.use(express.json())

router.get('/', (_, res) => {
  res.send('Flutter Prawnik Test Server')
})

app.post('/message', (req, res) => {
  const { body } = req

  console.log(body)

  res.send({ status: 200 })
})

app.use(`/.netlify/functions/api`, router)

const handler = serverless(app)
module.exports = { handler }