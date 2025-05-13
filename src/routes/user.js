const express = require('express');
const router = express.Router()

const { getUserInfo } = require('../controllers/userController')


// GET USER INFO
router.post('/:userId', getUserInfo)

module.exports = router