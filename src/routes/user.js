const express = require('express');
const router = express.Router()
const connection = require('../config/database');

// GET ALL PRODUCTS
router.get('/products', (req, res) => {
  connection.execute('SELECT products.product_id, products.user_id, products.product_name, products.product_price, products.product_thumbnail, products.product_stock, users.user_name, city.city_name, category.category_name FROM products JOIN users ON products.user_id = users.id_user JOIN city ON users.city_id = city.city_id JOIN category ON products.category_id = category.category_id', (err, result) => {
    if (err) {
      res.status(400).json(err)
    }
    else {
      res.status(200).json(result)
    }
  })
})

// GET DETAIL PRODUCT
router.get('/product/:productId/:userId', (req, res) => {
  const productId = req.params.productId
  const userId = req.params.userId

  connection.execute('SELECT products.*, users.user_name, city.city_name, category.category_name FROM products JOIN users ON products.user_id = users.id_user JOIN city ON users.city_id = city.city_id JOIN category ON products.category_id = category.category_id WHERE products.product_id = ? AND users.id_user = ?', [productId, userId], (err, result) => {
    if (err) {
      res.status(400).json(err)
    }
    else {
      res.status(200).json(result)
    }
  })
})

// STORE TO CART
router.post('/cart', (req, res) => {
  const { productId, userId, quantity, price } = req.body

  connection.execute('SELECT cart_id FROM cart WHERE product_id = ? AND user_id = ?', [productId, userId], (err, result) => {
    if (err) {
      return res.status(500).json(err)
    }
    else {
      if (result.length > 0) {
        console.log(result)
        connection.execute('UPDATE cart SET cart_quantity = ?, cart_total_price = ? WHERE cart_id = ?', [quantity, quantity * price, result[0].cart_id], (errUpdate, resultUpdate) => {
          if (errUpdate) {
            return res.status(500).json(errUpdate)
          }
          else {
            return res.status(200).json(resultUpdate)
          }
        })
      }
      else {
        connection.execute('INSERT INTO cart (product_id, user_id, cart_quantity, cart_total_price) VALUES (?, ?, ?, ?)', [productId, userId, quantity, quantity * price], (errInsert, resultInsert) => {
          if (errInsert) {
            return res.status(500).json(errInsert)
          }
          else {
            return res.status(200).json(resultInsert)
          }
        })
      }
    }
  })
})


// DELETE CART



// UPDATE CART



// CHECKOUT AND SEND EMAIL


module.exports = router