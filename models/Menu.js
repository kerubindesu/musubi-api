import mongoose from "mongoose"

const menuSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    link: {
        type: String,
        required: true
    },
    icon: {
        type: String,
    },
},
{
    timestamps: true
})

export default mongoose.model('Menu', menuSchema);