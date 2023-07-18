const serverless = require('serverless-http')
const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const cloudinary = require('cloudinary')
const { join } = require('path')

const router = express.Router()

app.use(require('cors')())
app.use(express.json())
app.use(require('express-fileupload')())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())

require('dotenv').config()

cloudinary.config({ 
  cloud_name: 'dtxigsrtn', 
  api_key: '176125755111887', 
  api_secret: process.env.CLOUDINARY_API_SECRET, 
})

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

const imagesDb = {}

router.post('/image', async (req, res) => {
  const { image } = req.files
  const imageExt = image.name.split('.').slice(-1)[0]
  const user = req.body.user

  try {
    const path = `data:image/${imageExt};base64,${image.data.toString('base64')}`
    const result = await cloudinary.v2.uploader.upload(path, {
      folder: 'images',
      use_filename: true,
    })

    if (imagesDb[user]) {
      imagesDb[user].push(result.secure_url)
    } else {
      imagesDb[user] = []
      imagesDb[user].push(result.secure_url)
    }

    console.log(imagesDb)
    res.send({ secureUrl: result.secure_url, })
  } catch (error) {
    throw Error(error)
  }
})

router.get('/get-images/:id', async (req, res) => {
  const { id } = req.params

  if (imagesDb[id]) {
    res.send({ images: imagesDb[id] })
  } else {
    res.send([])
  }
})

app.use(`/.netlify/functions/api`, router)

const handler = serverless(app)
module.exports = { handler }