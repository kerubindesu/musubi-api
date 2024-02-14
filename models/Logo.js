import mongoose from "mongoose"

const logoSchema = new mongoose.Schema({
    image: {
        type: String,
        required: true
    },
    img_url: {
        type: String,
        required: true
    },
},
{
    timestamps: true
})

export default mongoose.model('Logo', logoSchema);