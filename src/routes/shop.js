const express = require('express');
const router = express.Router()
const connection = require('../config/database');
const e = require('express');

// CREATE PRODUCT
router.post('/product', (req, res) => {
  const { categoryId, name, price, thumbnail, description, stock } = req.body

  connection.execute('SELECT `product_id` FROM `products` WHERE `user_id` = ? ORDER BY `product_id` DESC LIMIT 1', [req.session.userId], (errSelectProductId, resultSelectProductId) => {
    if (errSelectProductId) {
      res.status(400).json(errSelectProductId)
    }
    else {
      if (resultSelectProductId.length <= 0) {
        connection.execute('INSERT INTO `products` (`product_id`,`user_id`, `category_id`, `product_name`,`product_price`,`product_thumbnail`, `product_description`, `product_stock`,`product_sold`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [1, req.session.userId, categoryId, name, price, thumbnail, description, stock, 0], (err, result) => {
          if (err) {
            res.status(400).json(err)
          }
          else {
            res.status(200).json(result)
          }
        })
      }
      else {
        connection.execute('INSERT INTO `products` (`product_id`,`user_id`, `category_id`, `product_name`,`product_price`,`product_thumbnail`, `product_description`, `product_stock`,`product_sold`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [++resultSelectProductId[0].product_id, req.session.userId, categoryId, name, price, thumbnail, description, stock, 0], (err, result) => {
          if (err) {
            res.status(400).json(err)
          }
          else {
            res.status(200).json(result)
          }
        })
      }
    }
  })
})


// GET ALL PRODUCT
router.get('/products', (req, res) => {
  connection.execute('SELECT products.product_id, products.product_name, products.product_price, products.product_stock, products.product_sold ,category.category_name FROM products INNER JOIN category ON products.category_id = category.category_id WHERE products.user_id = ?', [req.session.userId], (err, result) => {
    if (err) {
      res.status(500).json({ "isError": true, "error": err })
    }
    else {
      if (result.length > 0) {
        res.status(200).json({ "isError": false, "data": result })
      }
      else {
        res.status(404).json({ "isError": true, "message": "Data tidak ditemukan" })
      }
    }
  })
})


// GET DETAIL PRODUCT
router.get('/product/:productId', (req, res) => {
  const productId = req.params.productId
  connection.execute('SELECT products.*, category.* FROM products INNER JOIN category ON products.category_id = category.category_id WHERE products.user_id = ? AND products.product_id = ?', [req.session.userId, productId], (err, result) => {
    if (err) {
      res.status(500).json({ "isError": true, "error": err })
    }
    else {
      if (result.length > 0) {
        res.status(200).json({ "isError": false, "data": result })
      }
      else {
        res.status(404).json({ "isError": true, "message": "Data tidak ditemukan" })
      }
    }
  })
})


// UPDATE PRODUCT
router.patch('/product/:productId', (req, res) => {
  const { categoryId, name, price, thumbnail, description, stock } = req.body
  const productId = req.params.productId
  connection.execute('UPDATE `products` SET `category_id` = ?, `product_name` = ?, `product_price` = ?,`product_thumbnail` = ?,`product_description` = ?, `product_stock` = ? WHERE `user_id` = ? AND `product_id` = ?',
    [categoryId, name, price, thumbnail, description, stock, req.session.userId, productId], (err, result) => {
      if (err) {
        res.status(500).json({ "isError": true, "error": err })
      }
      else {
        if (result.affectedRows > 0) {
          res.status(200).json({ "isError": false, "data": result })
        }
        else {
          res.status(404).json({ "isError": true, "message": "Data tidak ditemukan" })
        }
      }
    })
})



// DELETE PRODUCT
router.delete('/product/:productId', (req, res) => {
  const productId = req.params.productId
  connection.execute('DELETE FROM products WHERE product_id = ? AND user_id = ? ', [productId, req.session.userId], (err, result) => {
    if (err) {
      res.status(500).json({ "isError": true, "error": err })
    }
    else {
      if (result.affectedRows > 0) {
        res.status(200).json({ "isError": false, "data": result })
      }
      else {
        res.status(404).json({ "isError": true, "message": "Data tidak ditemukan" })
      }
    }
  })
})

module.exports = router