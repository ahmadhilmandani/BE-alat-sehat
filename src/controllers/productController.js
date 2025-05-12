
const connection = require('../config/database');
const ejs = require('ejs')
const path = require('path')
const pdf = require('html-pdf')
const nodemailer = require('nodemailer')


const createProduct = (req, res) => {
  const { categoryId, name, price, thumbnail, description, stock, shopId } = req.body

  connection.execute('SELECT `product_id` FROM `products` WHERE `user_id` = ? ORDER BY `product_id` DESC LIMIT 1', [shopId], (errSelectProductId, resultSelectProductId) => {
    if (errSelectProductId) {
      res.status(400).json(errSelectProductId)
    }
    else {
      if (resultSelectProductId.length <= 0) {
        connection.execute('INSERT INTO `products` (`product_id`,`user_id`, `category_id`, `product_name`,`product_price`,`product_thumbnail`, `product_description`, `product_stock`,`product_sold`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [1, shopId, categoryId, name, price, thumbnail, description, stock, 0], (err, result) => {
          if (err) {
            res.status(400).json(err)
          }
          else {
            res.status(200).json(result)
          }
        })
      }
      else {
        connection.execute('INSERT INTO `products` (`product_id`,`user_id`, `category_id`, `product_name`,`product_price`,`product_thumbnail`, `product_description`, `product_stock`,`product_sold`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)', [++resultSelectProductId[0].product_id, shopId, categoryId, name, price, thumbnail, description, stock, 0], (err, result) => {
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
}


const getAllProducts = (req, res) => {
  const shopId = req.params.shopId

  const query = `
  SELECT 
    products.product_thumbnail, 
    products.product_id, 
    products.product_name, 
    products.product_price, 
    products.product_stock, 
    products.product_sold,
    category.category_name,
    shops.shop_id,
    shops.shop_name,
    shops.shop_address,
    shops.city_id,
    shops.shop_contact,
    cities.city_name
  FROM
    products
  INNER JOIN
    shops ON products.shop_id = shops.shop_id
  AND INNER JOIN
    cities ON shops.city_id = cities.city_id
  AND INNER JOIN
    category ON products.category_id = category.category_id
`;

  connection.execute(query, (err, result) => {
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
}

const getDetailProduct = (req, res) => {
  const query = `
  SELECT 
    products.*,
    category.*
  FROM
    products
  INNER JOIN
    category ON products.category_id = category.category_id
  WHERE
    AND products.product_id = ?
`;

  const productId = req.params.productId
  connection.execute(query, [productId], (err, result) => {
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
}

const updateProduct = (req, res) => {
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
}


const deleteProduct = (req, res) => {
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
}


const checkoutAndSendEmail = (req, res) => {
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
}


module.exports = { createProduct, getAllProducts, getDetailProduct, updateProduct, deleteProduct, checkoutAndSendEmail }