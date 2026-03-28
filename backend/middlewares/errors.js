export default (err, req, res, mext) => {
  if (process.env.NODE_ENV === "development") {
    res.status(err?.statusCode || 500).json({
      message: err?.message || "Internal Server Error",
      error: err,
      stack: err?.stack,
    });
  }

  if (process.env.NODE_ENV === "production") {
    res.status(err?.statusCode || 500).json({
      message: err?.message || "Internal Server Error",
    });
  }
};
