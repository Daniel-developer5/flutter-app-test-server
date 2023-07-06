const express = require('express')
const app = express()
const PORT = 3000 || process.env.PORT

app.use(require('cors')())
app.use(express.json())

app.get('/', (_, res) => {
  res.send('Flutter Prawnik Test Server')
})

app.post('/message', (req, res) => {
  const { body } = req

  console.log(body)

  res.send({ status: 200 })
})

app.listen(PORT)

exports.handler = async (event, context) => {
  const response = await app(event, context)
  return response
}
