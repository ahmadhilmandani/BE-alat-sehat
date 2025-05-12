const express = require('express');
const router = express.Router()


const { createProduct, getAllProducts, updateProduct, deleteProduct, checkoutAndSendEmail } = require('../controllers/productController')

// CREATE PRODUCT
router.post('/', createProduct)


// GET ALL PRODUCT
router.get('/:shopId', getAllProducts)


// GET DETAIL PRODUCT
router.get('/:productId', getDetailProduct)


// UPDATE PRODUCT
router.patch('/:productId', updateProduct)


// DELETE PRODUCT
router.delete('/:productId', deleteProduct)


// CHECKOUT AND SEND EMAIL
router.post('/checkout/:shopId/:userId', checkoutAndSendEmail)


module.exports = router