const dotenv = require('dotenv')
dotenv.config()

const express = require('express');
const app = express();
const PORT = process.env.PORT || 8000
const cors = require('cors')

const session = require('express-session');


// const { verifyUser, verifyShop, verifyAdmin } = require('./src/middleware/verifying')

// app.use(session({
//   secret: 'rahasia',
//   resave: false,
//   saveUninitialized: true,
//   cookie: {
//     maxAge: 3600000
//   }
// }));

const authRoute = require('./src/routes/auth')
const userRoute = require('./src/routes/user')
const productRoute = require('./src/routes/product')
const cartRoute = require('./src/routes/cart')

const corsOptions = {
  origin: "http://localhost:5173"
}

app.use(cors(corsOptions))
app.use(express.json())
app.use(express.urlencoded({extended: true}))

app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`)
  next()
})

app.use('/api/auth', authRoute)
app.use('/api/user', userRoute)
app.use('/api/product', productRoute)
app.use('/api/cart', cartRoute)

app.listen(PORT, () => {
  console.log(`listeing on port: ${PORT}`)
});