const connection = require('../config/database');


const getCart = (req, res) => {
  const userId = req.params.userId
  connection.execute('SELECT cart.*, products.product_name, users.user_name FROM cart INNER JOIN products ON cart.product_id = products.product_id AND cart.shop_id = products.user_id INNER JOIN users ON cart.shop_id = users.id_user WHERE cart.user_id = ? ORDER BY shop_id', [userId], (err, result) => {
    if (err) {
      res.status(500).json(err)
    }
    else {
      res.status(200).json(result)
    }
  })
}

const getDetailCart = (req, res) => {
  const cartId = req.params.cartId
  connection.execute('SELECT cart.*, products.product_name, products.product_price, users.user_name FROM cart INNER JOIN products ON cart.product_id = products.product_id AND cart.shop_id = products.user_id INNER JOIN users ON cart.shop_id = users.id_user WHERE cart.cart_id = ? ', [cartId], (err, result) => {
    if (err) {
      res.status(500).json(err)
    }
    else {
      res.status(200).json(result)
    }
  })
}

const storeProductToCart = (req, res) => {
  const { productId, shopId, userId, quantity, price } = req.body
  connection.execute('SELECT cart_id FROM cart WHERE product_id = ? AND user_id = ? AND shop_id = ?', [productId, userId, shopId], (err, result) => {
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
        connection.execute('INSERT INTO cart (product_id, user_id, shop_id, cart_quantity, cart_total_price) VALUES (?, ?, ?, ?, ?)', [productId, userId, shopId, quantity, quantity * price], (errInsert, resultInsert) => {
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
}

const deleteProductToCart = (req, res) => {
  const cartId = req.params.cartId
  connection.execute('DELETE FROM cart WHERE cart_id = ?', [cartId], (err, result) => {
    if (err) {
      res.status(500).json(err)
    }
    else {
      res.status(200).json(result)
    }
  })
}


const updateCart = (req, res) => {
  const cartId = req.params.cartId
  const { quantity, price } = req.body
  connection.execute('UPDATE cart SET cart_quantity = ?, cart_total_price = ? WHERE cart_id = ?', [quantity, quantity * price, cartId], (err, result) => {
    if (err) {
      res.status(500).json(err)
    }
    else {
      res.status(200).json(result)
    }
  })
}

module.exports = { getCart, getDetailCart, storeProductToCart, deleteProductToCart, updateCart }