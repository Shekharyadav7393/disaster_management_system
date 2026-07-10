import morgan from "morgan";
import logger from "../utils/logger.js";

// Override the stream method by telling Morgan to use our custom logger instead of the console.
const stream = {
  // Use the http severity
  write: (message) => logger.info(message.trim()),
};

const skip = () => {
  const env = process.env.NODE_ENV || "development";
  return env !== "development";
};

const morganMiddleware = morgan(
  ":method :url :status :res[content-length] - :response-time ms",
  { stream, skip }
);

export default morganMiddleware;
