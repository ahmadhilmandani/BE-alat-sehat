const express = require('express');
const app = express();
const PORT = 5020
const cors = require('cors')

const session = require('express-session');


const { verifyUser, verifyShop, verifyAdmin } = require('./src/middleware/verifying')

app.use(session({
  secret: 'rahasia',
  resave: false,
  saveUninitialized: true,
  cookie: {
    maxAge: 3600000 // Waktu kedaluwarsa dalam milidetik (1 jam)
  }
}));

const authRoute = require('./src/routes/auth')
const shopRoute = require('./src/routes/shop')
const userRoute = require('./src/routes/user')

app.use(cors())
app.use(express.json())
app.use(express.urlencoded())

app.use((req, res, next) => {
  console.log(req.method)
  console.log(req.url)
  next()
})

app.use('/api/auth', authRoute)
app.use('/api/shop', verifyUser, verifyShop, shopRoute)
app.use('/api/user', userRoute)

app.listen(PORT, () => {
  console.log(`listeing on port: ${PORT}`)
});