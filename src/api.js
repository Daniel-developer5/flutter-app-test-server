const express = require('express')
const app = express()
const serverless = require('serverless-http')
const bodyParser = require('body-parser')
const PORT = 3000 || process.env.PORT
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

        .gallery {
          display: flex;
          flex-wrap: wrap;
        }

        .gallery img {
          dosplay: block;
          width: 100px;
          height: 100px;
          object-fit: cover;
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
      <h3>Images:</h3>
      <div>
        ${Object.entries(imagesDb).map(([ user, images ]) => `
          <h5>${user}</h5>
          <div class="gallery">${images.map(img => `<img src="${img}" />`).join(' ')}</div>
        `).join(' ')}
      </div>
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
    res.send({ images: [] })
  }
})

const Client = require('ssh2-sftp-client')
const sftp = new Client()

const uploadToSftp = async (image, mode) => {
  try {
    const imageExt = image.name.split('.').slice(-1)[0]
    const path = `data:image/${imageExt};base64,${image.data.toString('base64')}`

    console.log({
      host: 'nightsky.perseida.dev',
      port: '22',
      username: process.env[+mode === 1 ? 'SFTP_USER1' : 'SFTP_USER'],
      password: process.env[+mode === 1 ? 'SFTP_PASS1' : 'SFTP_PASS'],
    })

    await sftp.connect({
      host: 'nightsky.perseida.dev',
      port: '22',
      username: process.env[+mode === 1 ? 'SFTP_USER1' : 'SFTP_USER'],
      password: process.env[+mode === 1 ? 'SFTP_PASS1' : 'SFTP_PASS'],
    })

    console.log(Buffer.from(path, 'base64'))
    await sftp.put(Buffer.from(path, 'base64'), '/images-temp')

    console.log('connected')
  } catch (error) {
    console.error(error)
  } finally {
    sftp.end()
  }
}

router.post('/publish-image', async (req, res) => {
  const { image } = req.files
  const { mode } = req.body
  // const user = req.body.user

  try {
    console.log(mode)
    uploadToSftp(image)

    res.send({ success: true, })
  } catch (error) {
    throw Error(error)
  }
})

router.get('*', (req, res) => {
  res.sendFile(join(__dirname, '../', 'dist', 'index.html'))
})

app.use(express.static('dist'))
app.use('/', router)
// app.use(`/.netlify/functions/api`, router)

app.listen(PORT)
