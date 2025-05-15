const mysql = require('mysql2/promise')

let connection 

async function connectDb() {
  if (!connection) {    
    connection =  await mysql.createConnection(
      {
        host: process.env.MYSQL_HOST,
        user: process.env.MYSQL_USERNAME,
        password: process.env.MYSQL_PASSWORD,
        database: process.env.MYSQL_DB,
        namedPlaceholders: true,
      }
    )
  }
  return connection
}

module.exports = connectDb