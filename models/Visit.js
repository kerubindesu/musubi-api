import mongoose from "mongoose";

const visitSchema = new mongoose.Schema({
  page: {
    type: String,
    required: true
  },
  visitedAt: {
    type: Date,
    default: Date.now
  },
  ipAddress: String
});

export default mongoose.model("Visit", visitSchema);