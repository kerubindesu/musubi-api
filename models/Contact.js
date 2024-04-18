import mongoose from "mongoose";

const contactSchema = new mongoose.Schema(
    {
        company_name: {
            type: String,
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
        whatsapp_number: {
            type: String,
            required: true
        },
        email: {
            type: String,
            required: true
        },
        address: {
            type: String,
            required: true
        },
        location: {
            type: {
              type: String,
              enum: ['Point'],
              default: 'Point'
            },
            coordinates: {
              type: [Number],
              required: true
            }
        }
    },
    {
        timestamps: true
    }
)

export default mongoose.model("Contact", contactSchema)