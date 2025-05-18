const jwt = require('jsonwebtoken')
const authConfig = require('../config/authConfig')
const connectDb = require('../config/database')

const ROLE_CUSTOMER = 'customer'
const ROLE_MERCHANT = 'merchant'
const ROLE_MERCHANT_ADMIN = 'merchant admin'
const ROLE_SUPER_ADMIN = 'super admin'

const verifyToken = async (req, res, next) => {
  const connection = await connectDb()
  try {
    const token = req.headers['authorization']
    if (!token) {
      return res.status(401).send({ 'msg': 'Anda tidak memiliki token' })
    }
    const decodeToken = await jwt.verify(token.replace('Bearer ', ''), authConfig.secret)

    const queryUser = `
      SELECT
        u.*, r.role_name
      FROM
        users AS u
      INNER JOIN
        user_roles AS ur
      ON
        u.user_id = ur.user_id
      INNER JOIN
        roles AS r
      ON
        ur.role_id = r.role_id
      WHERE
        u.user_id = ?
    `

    const [result] = await connection.execute(queryUser, [decodeToken.user_id])
    req.user = result

    next()
  } catch (error) {
    if (connection) {
      res.status(401).send({ 'msg': 'Tidak memiliki Otoritas' })
    }

  }
}

const checkIsCustomer = async (req, res, next) => {
  const isMerchant = req.user.roles.includes(ROLE_CUSTOMER)

  if (isMerchant) {
    next()
  } else {
    return res.status(401).send({ 'msg': 'Anda tidak memiliki hak mengakses ini' })
  }
}

const checkIsMerchant = async (req, res, next) => {
  const isMerchant = req.user.roles.includes(ROLE_MERCHANT)

  if (isMerchant) {
    next()
  } else {
    return res.status(401).send({ 'msg': 'Anda tidak memiliki hak mengakses ini' })
  }
}

const checkIsMerchantAdmin = async (req, res, next) => {
  const isMerchantAdmin = req.user.roles.includes(ROLE_MERCHANT_ADMIN)

  if (isMerchantAdmin) {
    next()
  } else {
    return res.status(401).send({ 'msg': 'Anda tidak memiliki hak mengakses ini' })
  }
}

const checkIsSuperAdmin = async (req, res, next) => {
  const isSuperAdmin = req.user.roles.includes(ROLE_SUPER_ADMIN)

  if (isSuperAdmin) {
    next()
  } else {
    return res.status(401).send({ 'msg': 'Anda tidak memiliki hak mengakses ini' })
  }
}


module.exports = { verifyToken, checkIsCustomer, checkIsMerchant, checkIsMerchantAdmin, checkIsSuperAdmin }