const bcrypt = require('bcrypt')

const connection = require('../config/database')
const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;

const register = (req, res) => {
  const { email, name, password, confPassword, dateBirth, addreas, cityId, contact, paypalId } = req.body
  const role = req.params.role

  // CONFIRM PASSWORD
  if (password != confPassword)
    return res.status(400).send({ "isError": true, "message": "Password tidak sama" })

  // CHECK EMAIL FORMAT
  if (emailRegex.test(email) == false)
    return res.status(400).send({ "isError": true, "message": "Masukan format email yang benar" })

  // HASHING PASSWORD
  bcrypt.hash(password, 10, (errHash, hash) => {
    // IF HASH NO PROB
    if (!errHash) {
      // INSERT TO DB
      connection.execute('INSERT INTO `users` (user_name, user_email , user_password, user_date_birth, user_address, city_id, user_contact, user_paypal_id, user_role, is_verified) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', [name, email, hash, dateBirth, addreas, cityId, contact, paypalId, role, 0], (errSql, result) => {
        // IF ERROR
        if (errSql) {
          // IF ERROR IS DUPLICATE EMAIL
          if (errSql.code == "ER_DUP_ENTRY") {
            return res.status(409).send(
              { "isError": true, "message": "Email sudah terdaftar", "error": errSql }
            )
          }
          // IF THE ERROR NOT DUNPLICATE
          else {
            return res.status(400).send(
              { "isError": true, "error": errSql }
            )
          }
        }
        // IF IT'S ALL GOOD
        else {
          return res.status(201).send({
            "isError": false,
            "data": result
          })
        }
      })
    }
    // IF HASHING ERROR
    else {
      return res.status(500).json({
        "isError": true,
        "error": errHash
      })
    }
  })
}

const login = (req, res) => {
  const { email, password } = req.body

  // CHECKING THE EMAIL FORMAT IS VALID 
  if (emailRegex.test(email) == false)
    return res.status(400).send({ "isError": true, "message": "Masukan format email yang benar" })

  // GET THE EMAIL
  connection.execute('SELECT * FROM `users` WHERE `user_email` = ? LIMIT 1', [email], (errEmail, resultEmail) => {
    // IF ERROR
    if (errEmail) {
      console.log(errEmail)
      res.json(errEmail)
    }
    // IF NOT ERROR
    else {
      // COMPARING THE PASSWORD
      bcrypt.compare(password, resultEmail[0].user_password, (err, result) => {
        // IF THE EMAIL GOOD, PASSWORD GOOD
        if (result) {
          // SET SESSION USER ID
          req.session.userId = resultEmail[0].id_user;
          res.send([
            {
              "id_user": resultEmail[0].id_user,
              "email": resultEmail[0].user_email,
              "name": resultEmail[0].user_name,
              "role": resultEmail[0].user_role,
            }
          ])
        }
        else {
          res.json(err)
        }
      })
    }
  })
}

const logout = (req, res) => {
  delete req.session.userId
  delete req.session.role

  res.status(200).json({ "message": "Anda telah logout." });
}

module.exports = { register, login, logout }