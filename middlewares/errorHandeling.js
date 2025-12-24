function validationErrorFormatter(errorsArray) {
  return errorsArray.map((err) => ({ message: err.msg }));
}

function globalErrorHandler(err, req, res, next) {
  console.log(err);
  res.status(500).json({
    success: false,
    message: "Internal Server Error",
  });
}

module.exports = { validationErrorFormatter, globalErrorHandler };
