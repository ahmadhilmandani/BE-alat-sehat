const errorMiddleware = (err, req, res, next) => {
  const errStat = err.status || 500

  return res.status(errStat).send({
    'is_error': true,
    'msg': err.message
  })
}

module.exports = { errorMiddleware }