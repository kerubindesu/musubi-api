import mongoose from "mongoose"

const categorySchema = new mongoose.Schema({
    name: {
        type: String,
        unique: true,
        required: true
    },
    description: {
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
    products: [{ 
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product" 
    }]
},
{
    timestamps: true
})

export default mongoose.model("Category", categorySchema);