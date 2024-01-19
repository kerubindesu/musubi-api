import mongoose from "mongoose";
import AutoIncrementFactory from "mongoose-sequence";

const AutoIncrement = AutoIncrementFactory(mongoose);

const postSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: "User"
        },
        title: {
            type: String,
            required: true
        },
        text: {
            type: String,
            required: "npc"
        },
        completed: {
            type: Boolean,
            default: false
        },
        ticket: {
            type: Number
        }
    },
    {
        timestamps: true
    }
)

postSchema.plugin(AutoIncrement, {
    inc_field: "ticket",
    id: "ticketNums",
    start_seq: 500
})

export default mongoose.model("Post", postSchema)