const express = require('express');
const router = express.Router()
const { verifyToken, checkIsMerchantAdmin } = require('../middleware/authMiddleware')

const { create, getAll, getDetail, updateProductController, deleteProductController, checkoutAndSendEmail, softDeleteProductController } = require('../controllers/productController')

// CREATE PRODUCT
router.post('/', verifyToken, checkIsMerchantAdmin, create)


// GET ALL PRODUCT
router.get('/', getAll)


// GET DETAIL PRODUCT
router.get('/:productId', getDetail)


// UPDATE PRODUCT
router.patch('/:productId', updateProductController)


// DELETE PRODUCT
router.delete('/:productId', verifyToken, checkIsMerchantAdmin, softDeleteProductController)


// CHECKOUT AND SEND EMAIL
router.post('/checkout/:shopId/:userId', checkoutAndSendEmail)


module.exports = router