const express = require('express')
const app = express()
const serverless = require('serverless-http')
const bodyParser = require('body-parser')
const PORT = 3000 || process.env.PORT

const router = express.Router()

app.use(require('cors')())
app.use(express.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())

require('dotenv').config()

const usersDb = {
  /**
   * @field users
   * @type {{ email: string, name: string, password: string, }[]} user
   */
  users: [],
  /**
   * @function addUser
   * @param {object} user 
   * @param {string} user.email
   */
  addUser(user) {
    if (this.users.some(({ email }) => email === user.email)) {
      return { error: 'User exist.' }
    }

    this.users.push(user)
    console.log(usersDb.users)
    return { success: true, }
  },
  /**
   * @function addUser
   * @param {object} user 
   * @param {string} user.email
   */
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

router.post('/admin', (req, res) => {
  const { login, password } = req.body

  if (login === process.env.ADMIN_LOGIN && password === process.env.ADMIN_PASSWORD) {
    const html = `
      <style>
        * { font-family: Arial; }

        ul {
          list-style-type: none;
          padding: 0;
          margin: 12px 0;
          display: grid;
          gap:10px;
        }

        li {
          padding: 10px;
          border: 1px solid #333;
          background-color: #eee;
          display: grid;
          gap: 10px;
          margin: 0;
        }

        li p {
          margin: 0;
        }

        li p span {
          font-weight: bold;
        }
      </style>

      <h3>Messages:</h3>
      <ul>
        ${messagesDb.map(msg => `<li>
          <p><span>Email: </span> ${msg.email}</p>
          <p><span>Category: </span> ${msg.category}</p>
          <p><span>Message: </span> ${msg.message}</p>
        </li>`).join(' ')}
      </ul>
      <h3>Users:</h3>
      <ul>
        ${usersDb.users.map(user => `<li>
          <p><span>Email: </span> ${user.email}</p>
          <p><span>Name: </span> ${user.name}</p>
        </li>`).join(' ')}
      </ul>
    `

    res.send(html)
  }

  res.send('Credentials are incorrect.')
})

router.get('*', (req, res) => {
  res.sendFile('dist/index.html')
})

app.use(express.static('dist'))
app.use('/', router)
// app.use(`/.netlify/functions/api`, router)

app.listen(PORT)
