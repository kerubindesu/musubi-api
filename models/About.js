import mongoose from "mongoose";

const aboutSchema = new mongoose.Schema(
    {
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
        maps: {
            type: String,
            required: true
        }
    },
    {
        timestamps: true
    }
)

export default mongoose.model("About", aboutSchema)