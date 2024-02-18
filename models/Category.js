import mongoose from "mongoose"
import Post from "./Post.js";

const categorySchema = new mongoose.Schema({
    name: {
        type: String,
        unique: true,
        required: true
    },
    text: {
        type: String,
        required: true
    },
    image: {
        type: String,
        required: true
    },
    img_url: {
        type: String,
        required: true
    },
    posts: [{ 
        type: mongoose.Schema.Types.ObjectId,
        ref: "Post" 
    }]
},
{
    timestamps: true
})

export default mongoose.model("Category", categorySchema);