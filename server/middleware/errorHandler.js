const notFound = (req, res) => {
  res.status(404).json({ message: "Route not found" });
};

const errorHandler = (error, req, res, next) => {
  if (error.type === "entity.parse.failed") {
    return res.status(400).json({ message: "Invalid JSON body" });
  }

  if (error.statusCode) {
    return res.status(error.statusCode).json({ message: error.message });
  }

  console.error(error);
  return res.status(500).json({ message: "Internal server error" });
};

module.exports = { notFound, errorHandler };
