import mongoose from "mongoose"

const tagSchema = new mongoose.Schema({
    name: {
        type: String,
        unique: true,
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

export default mongoose.model("Tag", tagSchema);