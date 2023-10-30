const express = require('express');
const router = express.Router()
const connection = require('../config/database');
const ejs = require('ejs')
const path = require('path')
const pdf = require('html-pdf')
const nodemailer = require('nodemailer')

const dotenv = require('dotenv')
dotenv.config()


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



// GET CART
router.get('/carts/:userId', (req, res) => {
  const userId = req.params.userId
  console.log(userId)
  connection.execute('SELECT cart.*, products.product_name, users.user_name FROM cart INNER JOIN products ON cart.product_id = products.product_id AND cart.shop_id = products.user_id INNER JOIN users ON cart.shop_id = users.id_user WHERE cart.user_id = ? ORDER BY shop_id', [userId], (err, result) => {
    if (err) {
      res.status(500).json(err)
    }
    else {
      res.status(200).json(result)
    }
  })
})



// GET DETAIL CART
router.get('/cart/:cartId', (req, res) => {
  const cartId = req.params.cartId
  connection.execute('SELECT cart.*, products.product_name, users.user_name FROM cart INNER JOIN products ON cart.product_id = products.product_id AND cart.shop_id = products.user_id INNER JOIN users ON cart.shop_id = users.id_user WHERE cart.cart_id = ? ', [cartId], (err, result) => {
    if (err) {
      res.status(500).json(err)
    }
    else {
      res.status(200).json(result)
    }
  })
})



// STORE TO CART
router.post('/cart', (req, res) => {
  const { productId, shopId, userId, quantity, price } = req.body
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
})




// DELETE CART
router.delete('/cart/:cartId', (req, res) => {
  const cartId = req.params.cartId
  connection.execute('DELETE FROM cart WHERE cart_id = ?', [cartId], (err, result) => {
    if (err) {
      res.status(500).json(err)
    }
    else {
      res.status(200).json(result)
    }
  })
})




// UPDATE CART
router.patch('/cart/:cartId', (req, res) => {
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
})



// CHECKOUT AND SEND EMAIL
router.post('/checkout/:shopId/:userId', (req, res) => {
  const shopId = req.params.shopId
  const userId = req.params.userId
  const { paymentMethod } = req.body
  connection.execute('SELECT cart.*, products.product_stock, product_sold FROM cart JOIN products ON cart.shop_id = products.user_id AND cart.product_id = products.product_id WHERE cart.user_id = ? AND cart.shop_id =?', [userId, shopId], (errCart, resultCart) => {
    if (errCart) {
      res.status(500).json(errCart)
    }
    else {
      connection.execute('INSERT INTO transaction (user_id, payment_method) VALUES (?, ?)',
        [userId, paymentMethod],
        (errTransaction, resultTransaction) => {
          if (errTransaction) {
            res.status(500).json(errTransaction)
          }
          else {
            for (let index = 0; index < resultCart.length; index++) {
              connection.execute('INSERT INTO list_product_transaction (transaction_id, product_id, shop_id, product_quantity) VALUES (?, ?, ?, ?)', [resultTransaction.insertId, resultCart[index].product_id, resultCart[index].shop_id, resultCart[index].cart_quantity], (errListProductTransaction, resultListProductTransaction) => {
                if (errListProductTransaction) {
                  res.status(500).json(errListProductTransaction)
                }
              })

              connection.execute('UPDATE products SET product_stock = ?, product_sold = ? WHERE product_id = ? AND user_id = ?', [resultCart[index].product_stock - resultCart[index].cart_quantity, resultCart[index].product_sold + resultCart[index].cart_quantity, resultCart[index].product_id, resultCart[index].shop_id], (errProducts, resultProducts) => {
                if (errProducts) {
                  res.status(500).json(errProducts)
                }
              })
            }

            connection.execute('DELETE FROM cart WHERE cart.user_id = ? AND cart.shop_id =?', [userId, shopId], (errDeleteCart, resultDeleteCart) => {
              if (errDeleteCart) {
                res.status(500).json(errDeleteCart)
              }
              else {
                connection.execute('SELECT transaction.*, list_product_transaction.product_id, list_product_transaction.shop_id, list_product_transaction.product_quantity, products.product_name, products.product_price, users.id_user, users.user_name, users.user_address, users.user_contact,users.user_paypal_id FROM transaction JOIN list_product_transaction ON transaction.transaction_id = list_product_transaction.transaction_id JOIN products ON list_product_transaction.product_id = products.product_id AND list_product_transaction.shop_id = products.user_id JOIN users ON transaction.user_id = users.id_user WHERE transaction.transaction_id = ? AND users.user_role = ?', [resultTransaction.insertId, 'user'], (errUserData, resultUserData) => {
                  if (errUserData) {
                    res.status(500).json(errUserData)
                  }
                  else {
                    connection.execute('SELECT user_name FROM users WHERE id_user = ? ', [resultUserData[0].shop_id], (errShopData, resultShopData) => {
                      if (errShopData) {
                        res.status(500).json(errShopData)
                      }
                      else {
                        let temptTotalPrice = 0
                        for (let index = 0; index < resultUserData.length; index++) {
                          temptTotalPrice = temptTotalPrice + (resultUserData[index].product_quantity * resultUserData[index].product_price)
                        }
                        ejs.renderFile(
                          path.join(__dirname, "../view/", "pdfLayout.ejs"),
                          {
                            userData: resultUserData,
                            shopData: resultShopData,
                            totalPrice: temptTotalPrice
                          },
                          (err, str) => {
                            if (err) {
                              res.status(500).json(err)
                              console.log(err)
                            }
                            else {
                              let option = {
                                height: "9.5in",
                                width: "10.5in",
                                header: { height: "4mm" },
                                footer: { height: "4mm" },
                              }
                              pdf.create(str, option).toFile("test.pdf", (err, data) => {
                                if (err) {
                                  console.log(err)
                                  res.status(500).json(err)
                                }
                                else {
                                  const transporter = nodemailer.createTransport({
                                    service: 'gmail',
                                    auth: {
                                      user: process.env.MAIL,
                                      pass: process.env.PASS,
                                    }
                                  });
                                  const mailOptions = {
                                    from: '20081010057@student.upnjatim.ac.id',
                                    to: 'ahmadhilman554@gmail.com',
                                    subject: 'Subject of the Email',
                                    text: 'This is the text content of the email.',
                                    attachments: [
                                      {
                                        filename: 'text1.pdf',
                                        path: data.filename
                                      }
                                    ]
                                  };
                                  transporter.sendMail(mailOptions, (error, info) => {
                                    if (error) {
                                      console.log('Email tidak dapat dikirim: ' + error);
                                      res.status(500).send('Email tidak dapat dikirim');
                                    } else {
                                      console.log('Email berhasil dikirim: ' + info.response);
                                      res.status(200).send('Email berhasil dikirim');
                                    }
                                  })
                                  res.status(200).json(data)
                                }
                              })
                            }
                          }
                        )
                      }
                    })
                  }
                })
              }
            })
          }
        }
      )
    }
  })
})


module.exports = router