const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000,
      family: 4,
      retryWrites: true,
      w: "majority"
    });
    console.log("MongoDB connected");
    
    const adminDb = mongoose.connection.getClient().db("admin");
    try {
      const serverStatus = await adminDb.admin().serverStatus();
      const isReplicaSet = serverStatus.repl !== undefined;
      if (!isReplicaSet) {
        console.warn("⚠️  MongoDB is not running as a replica set. Transactions will not work. For production, use MongoDB Atlas or configure a replica set.");
      } else {
        console.log("✓ MongoDB replica set detected. Transactions are supported.");
      }
    } catch (error) {
      console.warn("⚠️  Could not verify replica set status:", error.message);
    }
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
