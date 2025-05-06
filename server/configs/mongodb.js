import mongoose from "mongoose";

// Connect to MongoDB database
const connectDB = async () => {
  mongoose.connection.on("connected", () => console.log("MongoDB connected"));

  await mongoose.connect(`${process.env.MONGODB_URI}/LMS`);
};

export default connectDB;
