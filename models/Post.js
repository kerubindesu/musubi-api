import mongoose from "mongoose";
import User from "./User.js";
import Category from "./Category.js";
import Tag from "./Tag.js";

const postSchema = new mongoose.Schema({
    title: {
        type: String,
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
    author: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: User
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: Category
    },
    tags: [{ 
        type: mongoose.Schema.Types.ObjectId,
        ref: Tag 
    }]
},
{
    timestamps: true
})

export default mongoose.model("Post", postSchema)