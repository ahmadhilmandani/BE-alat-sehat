const express = require('express');
const router = express.Router()
const { getCart, getDetailCart, storeProductToCart, deleteProductToCart, updateCart } = require('../controllers/cartController')

// GET CART
router.get('/:userId', getCart)



// GET DETAIL CART
router.get('/:cartId', getDetailCart)



// STORE TO CART
router.post('/', storeProductToCart)



// DELETE CART
router.delete('/:cartId', deleteProductToCart)




// UPDATE CART
router.patch('/:cartId', updateCart)



module.exports = router