const bcrypt = require('bcrypt')

const connectDb = require('../config/database')
const emailRegex = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;

const DEFAULT_ROLE = 1

const register = async (req, res) => {
  const connection = await connectDb();

  try {
    const { email, name, password, confPassword, dateBirth, addreas, cityId, contact, paypalId } = req.body
    const role = req.body.role || DEFAULT_ROLE

    // CONFIRM PASSWORD
    if (password != confPassword)
      return res.status(400).send({ "isError": true, "message": "Password tidak sama" })

    // CHECK EMAIL FORMAT
    if (emailRegex.test(email) == false)
      return res.status(400).send({ "isError": true, "message": "Masukan format email yang benar" })

    // HASHING PASSWORD
    const hash = await bcrypt.hash(password, 10)

    await connection.beginTransaction();

    // INSERT TO DB
    const queryInsertUser = `
      INSERT INTO users (
          user_name,
          user_email,
          user_password,
          user_date_birth,
          user_address,
          city_id,
          user_contact,
          user_paypal_id,
          created_at
      ) VALUES (
          ?, ?, ?, ?, ?, ?, ?, ?, ?
       )`
    const [resInsertUsers] = await connection.execute(queryInsertUser, [name, email, hash, dateBirth, addreas, cityId, contact, paypalId, new Date()])


    const queryInsertUserRole = `
      INSERT INTO user_roles (
        user_id,
        role_id
      ) VALUES (
       ?,
       ?
      )
    `
    await connection.execute(queryInsertUserRole, [resInsertUsers.insertId, role])

    await connection.commit()

    return res.status(201).send({
      'is_error': false,
      'msg': 'Terima Kasih Sudah Melakukan regristrasi! Selamat Datang!',
    })

  } catch (error) {
    if (connection) {
      await connection.rollback()

      return res.status(500).send({
        'is_error': true,
        'msg': 'Gagal Silahkan Ulangi Kembali atau Mohon Tunggu!',
        'traceback_err': {
          message: error.message || error,
          stack: error.stack || error,
          name: error.name || error,
        }
      })
    }
  }
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


const softDeleteUser = async (req, res) => {
  const connection = await connectDb();
  try {
    const { userId } = req.body

    if (!userId) {
      throw "Harus Menyertakan ID user"
    }

    const querySoftDelete = `
      UPDATE
          users
      SET
        is_delete = 1
      WHERE
        user_id = ?
    `

    await connection.execute(querySoftDelete, [userId])

    await connection.commit()


    return res.status(200).send({
      'is_error': false,
      'msg': 'Berhasil Menghapus Akun!',
    })

  } catch (error) {
    if (connection) {
      await connection.rollback()

      return res.status(500).send({
        'is_error': true,
        'msg': 'Gagal Silahkan Ulangi Kembali atau Mohon Tunggu!',
        'traceback_err': {
          message: error.message || error,
          stack: error.stack || error,
          name: error.name || error,
        }
      })
    }
  }
  // finally {
  //   if (connection) {
  //     await connection.end()
  //   }
  // }
}


const logout = (req, res) => {
  delete req.session.userId
  delete req.session.role

  res.status(200).json({ "message": "Anda telah logout." });
}

module.exports = { register, login, softDeleteUser, logout }