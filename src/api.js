const express = require('express')
const app = express()
const serverless = require('serverless-http')
const PORT = 3000 || process.env.PORT
const fs = require('fs/promises')

const router = express.Router();

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

app.use('/', router);
// app.use(`/.netlify/functions/api`, router);

app.listen(PORT)
