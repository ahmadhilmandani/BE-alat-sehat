const express = require('express');
const router = express.Router()

const { register, login, softDeleteUser, logout } = require('../controllers/authController.js')


// REGISTER
router.post('/register', register)


// DELETE
router.delete('/', softDeleteUser)


// LOGIN
router.post('/login', login)


// LOGOUT
router.get('/logout', logout)



module.exports = router