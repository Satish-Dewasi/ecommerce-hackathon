class ErrorHandler extends Error {
  // constructors
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;

    // creating error stack property
    Error.captureStackTrace(this, this.constructor);
  }
}

export default ErrorHandler;
