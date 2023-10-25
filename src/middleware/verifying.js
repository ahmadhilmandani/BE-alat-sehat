const connection = require('../config/database')

// VERIFY IF LOGIN OR NOT AND SET THE ROLE ON THE SESSION
const verifyUser = (req, res, next) => {
  if (!req.session.userId) {
    return res.status(401).json({ msg: "Belum login" });
  }

  connection.execute('SELECT `user_role`, `is_verified` FROM `users` WHERE `id_user` = ? LIMIT 1', [req.session.userId], (err, result) => {
    if (err) {
      res.status(500).json(err)
    }
    else {
      if (result.length > 0) {
        req.role = result[0].user_role
        req.isVerified = result[0].is_verified
        next()
      }
    }
  })
}

const verifyShop = (req, res, next) => {
  if (req.role !== 'shop') {
    return res.status(403).json({ "isError": true, "message": "Akses terlarang" });
  }
  console.log(req.isVerified)
  if (req.isVerified == 0) {
    return res.status(401).json({ "isError": true, "message": "Toko belum divefifikasi admin" });
  }
  next();
}

const verifyAdmin = (req, res, next) => {
  if (req.role !== 'superAdmin') {
    return res.status(403).json({ msg: "Akses terlarang" });
  }
  next();
}

module.exports = { verifyUser, verifyShop, verifyAdmin }