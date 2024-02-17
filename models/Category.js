import mongoose from "mongoose"

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
    }
},
{
    timestamps: true
})

export default mongoose.model('Category', categorySchema);