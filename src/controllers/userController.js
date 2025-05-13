const connection = require('../config/database')


const getUserInfo = (req, res) => {
  const userId = req.params.userId
  const query = `
    SELECT users.*, roles.role_name 
    FROM
      users
    INNER JOIN
      user_roles ON users.user_id = user_roles.user_id
    INNER JOIN
      roles ON user_roles.role_id = roles.role_id
    WHERE users.user_id = ?;
  `

  connection.execute(query, [userId], (errSql, result) => {
    // IF ERROR
    if (errSql) {
      return res.status(500).send(
        { "isError": true, "message": "Gagal, Coba Lagi!", "error": errSql }
      )
    }
    else {
      return res.status(200).send({
        "isError": false,
        "data": result
      })
    }
  })
}


module.exports = { getUserInfo }