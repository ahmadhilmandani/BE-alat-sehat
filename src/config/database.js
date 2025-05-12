const mysql = require('mysql2')

const connection = mysql.createConnection(
  {
    host: process.env.MYSQL_HOST,
    user: process.env.MYSQL_USERNAME,
    password: process.env.MYSQL_PASSWORD,
    database: process.env.MYSQL_DB
  }
)

module.exports = connection