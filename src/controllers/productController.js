
const connectDb = require('../config/database');
const ejs = require('ejs')
const path = require('path')
const pdf = require('html-pdf')
const nodemailer = require('nodemailer')
const { getAllProducts, createProducts, updateProduct, getProductById, hardDeleteProduct, softDeleteProduct } = require('../repositories/productRepositoreis')

const create = async (req, res, next) => {
  const connection = await connectDb()

  try {
    const { shop_id, category_id, product_name, product_price, product_thumbnail, product_description, product_stock } = req.body

    const products = await createProducts(shop_id, category_id, product_name, product_price, product_thumbnail, product_description, product_stock, 0, new Date())

    await connection.commit()
    return res.status(201).send({ 'is_error': false, 'msg': 'Berhasil Menambahkan produk', 'id': products.insertId })

  } catch (error) {
    next(error)
  }

}


const getAll = async (req, res, next) => {
  try {

    const products = await getAllProducts()
    return res.status(200).send({ 'is_error': false, 'data': products })

  } catch (error) {
    next(error)
  }
}


const getDetail = async (req, res, next) => {
  try {
    const { productId } = req.params

    const product = await getProductById(productId)
    return res.status(200).send({ 'is_error': false, 'data': product })

  } catch (error) {
    next(error)
  }
}


const updateProductController = async (req, res) => {
  const connection = await connectDb()
  
  try {
    const { category_id, product_name, product_price, product_thumbnail, product_description, product_stock, product_sold } = req.body
    const productId = req.params.productId

    await updateProduct(productId, category_id, product_name, product_price, product_thumbnail, product_description, product_stock, product_sold)

    await connection.commit()
    return res.status(200).send({ 'is_error': false, 'msg': 'Berhasil Update Product' })
    
  } catch (error) {
    next(error)
    
  }
}


const deleteProductController = async (req, res, next) => {
  try {

    const { productId } = req.params
    await hardDeleteProduct(productId)
    return res.status(200).send({ 'is_error': false, 'msg': 'berhasil hapus' })

  } catch (error) {
    next(error)
  }
}

const softDeleteProductController = async (req, res, next) => {
  try {

    const { productId } = req.params
    await softDeleteProduct(productId)
    return res.status(200).send({ 'is_error': false, 'msg': 'berhasil hapus' })

  } catch (error) {
    next(error)
  }
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


module.exports = { create, getAll, getDetail, updateProductController, deleteProductController, checkoutAndSendEmail, softDeleteProductController }