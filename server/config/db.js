const mongoose = require("mongoose");

const MONGO_URI = process.env.MONGO_URI;
const DB_NAME = (process.env.MONGO_DB || "").trim() || undefined;
const isTest = process.env.NODE_ENV === "test" || process.env.JEST_WORKER_ID !== undefined;

const RETRY_DELAYS = [1000, 2000, 4000, 8000, 16000];
const DEFAULT_SERVER_OPTIONS = {
  serverSelectionTimeoutMS: 15000,
  connectTimeoutMS: 15000,
  socketTimeoutMS: 45000,
  family: 4,
  retryWrites: !isTest,
  w: "majority"
};

const isRetryableError = (error) => {
  if (!error) return false;
  const retryableCodes = [
    "ETIMEDOUT",
    "ECONNREFUSED",
    "ECONNRESET",
    "ENOTFOUND",
    "ECONNABORTED",
    "ENETUNREACH",
    "EHOSTUNREACH",
    "ESERVFAIL"
  ];
  const retryableNames = [
    "MongoServerSelectionError",
    "MongoNetworkError",
    "MongoParseError"
  ];
  return retryableCodes.includes(error.code) || retryableNames.includes(error.name);
};

const logConnectionState = () => {
  const state = mongoose.connection.readyState;
  const labels = {
    0: "disconnected",
    1: "connected",
    2: "connecting",
    3: "disconnecting"
  };
  console.log(`MongoDB connection state: ${labels[state] || state}`);
};

const connectDB = async () => {
  if (!MONGO_URI) {
    throw new Error("MONGO_URI is not configured. Set it in server/.env");
  }

  if (mongoose.connection.readyState === 1) {
    console.log("MongoDB already connected");
    logConnectionState();
    return;
  }

  if (mongoose.connection.readyState === 2) {
    console.log("MongoDB connection already in progress...");
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error("MongoDB connection timed out")), 30000);
      mongoose.connection.once("open", () => {
        clearTimeout(timeout);
        console.log("MongoDB connection established");
        logConnectionState();
        resolve();
      });
      mongoose.connection.once("error", (err) => {
        clearTimeout(timeout);
        reject(err);
      });
    });
    return;
  }

  const attempts = RETRY_DELAYS.length;
  let lastError = null;

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    if (attempt > 0) {
      const delay = RETRY_DELAYS[attempt - 1];
      console.log(`MongoDB connection retry ${attempt}/${attempts - 1} in ${delay}ms...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }

    try {
      const options = { ...DEFAULT_SERVER_OPTIONS };
      if (DB_NAME) options.dbName = DB_NAME;

      await mongoose.connect(MONGO_URI, options);
      console.log(`MongoDB connected successfully (attempt ${attempt + 1})`);
      logConnectionState();

      try {
        const adminDb = mongoose.connection.getClient().db("admin");
        const serverStatus = await adminDb.admin().serverStatus();
        const isReplicaSet = serverStatus.repl !== undefined;
        if (!isReplicaSet) {
          console.warn("MongoDB is not running as a replica set. Transactions will not work. For production, use MongoDB Atlas or configure a replica set.");
        } else {
          console.log("MongoDB replica set detected. Transactions are supported.");
        }
      } catch (error) {
        console.warn("Could not verify replica set status:", error.message);
      }

      setupConnectionListeners();
      return;
    } catch (error) {
      lastError = error;
      console.error(`MongoDB connection attempt ${attempt + 1} failed:`, error.message);

      if (!isRetryableError(error)) {
        console.error("Non-retryable MongoDB error. Aborting connection attempts.");
        throw error;
      }
    }
  }

  console.error(`MongoDB connection failed after ${attempts} attempts. Last error:`, lastError?.message || "Unknown error");
  process.exit(1);
};

const setupConnectionListeners = () => {
  mongoose.connection.on("error", (error) => {
    console.error("MongoDB runtime error:", error.message);
  });

  mongoose.connection.on("disconnected", () => {
    console.warn("MongoDB disconnected. Attempting to reconnect...");
  });

  mongoose.connection.on("reconnected", () => {
    console.log("MongoDB reconnected successfully");
    logConnectionState();
  });

  mongoose.connection.on("connectionPoolExhausted", () => {
    console.warn("MongoDB connection pool exhausted");
  });
};

const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    console.log("MongoDB disconnected gracefully");
  } catch (error) {
    console.error("MongoDB disconnect error:", error.message);
  }
};

const getConnectionState = () => {
  const state = mongoose.connection.readyState;
  const labels = {
    0: "disconnected",
    1: "connected",
    2: "connecting",
    3: "disconnecting",
    99: "uninitialized"
  };
  return { state, label: labels[state] || state };
};

module.exports = {
  connectDB,
  disconnectDB,
  getConnectionState
};
