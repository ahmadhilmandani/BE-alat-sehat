const express = require('express');
const router = express.Router()

const { register, login, logout } = require('../controllers/authController.js')


// REGISTER
router.post('/register/:role?', register)


// LOGIN
router.post('/login', login)


// LOGOUT
router.get('/logout', logout)



module.exports = router