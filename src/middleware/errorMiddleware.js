const errorMiddleware = (err, req, res, next) => {
  const errStat = err.status || 500
  console.log(err)
  return res.status(errStat).send({
    'is_error': true,
    'stack': err.stack,
    'name': err.name,
    'msg': err.message,
  })
}

module.exports = { errorMiddleware }