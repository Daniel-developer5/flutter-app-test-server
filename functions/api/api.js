const serverless = require('serverless-http')
const express = require('express')
const app = express()

const router = express.Router()

app.use(require('cors')())
app.use(express.json())

const usersDb = {
  users: [],
  addUser(user) {
    if (this.users.some(({ email }) => email === user.email)) {
      return { error: 'User exist.' }
    }

    this.users.push(user)
    console.log(usersDb.users)
    return { success: true, }
  },
  getUser(user) {
    const getUser = this.users.filter(({ email, password }) => email === user.email && password === user.password)

    if (getUser.length) {
      return getUser[0]
    }

    return { error: 'Email, password or both are invaild.', }
  },
}

const messagesDb = []

router.get('/', (_, res) => {
  res.send('Flutter Prawnik Test Server')
})

router.post('/message', (req, res) => {
  messagesDb.push(req.body)

  res.send({ status: 200 })
})

router.post('/create-account', (req, res) => {
  const { body } = req

  const dbRes = usersDb.addUser(body)
  
  if (dbRes.error) {
    res.send({ error: dbRes.error, })
  } else {
    res.send({ status: 200, ...body, })
  }
})

router.post('/log-in', (req, res) => {
  const { body } = req

  const dbRes = usersDb.getUser(body)

  if (dbRes.error) {
    res.send({ error: dbRes.error, })
  } else {
    res.send({ ...dbRes, status: 200, })
  }
})

app.use(`/.netlify/functions/api`, router)

const handler = serverless(app)
module.exports = { handler }