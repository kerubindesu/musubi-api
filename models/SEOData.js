import mongoose from "mongoose";

const seoDataSchema = new mongoose.Schema({
    keyword: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
},
{
    timestamps: true
})

export default mongoose.model("SEOData", seoDataSchema)