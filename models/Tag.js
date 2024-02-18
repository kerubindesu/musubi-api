import mongoose from "mongoose"

const tagSchema = new mongoose.Schema({
    name: {
        type: String,
        unique: true,
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

export default mongoose.model("Tag", tagSchema);