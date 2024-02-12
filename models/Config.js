import mongoose from "mongoose";

const configSchema = new mongoose.Schema({
    theme: {
        type: String,
        required: true
    },
    color_palette: {
        primary: String,
        secondary: String,
        // noir: String,
        // blanc: String,
        // rouge: String,
        // violet: String,
        // jaune: String,
        // vert: String,
        // bleu: String,
        background: String,
        text: String
    },
    logo_url: String,
    width: Number,
    height: Number,
    description: String,
    site_name: String,
    site_description: String,
    keywords: [String],
    email_server: String,
    port: Number,
    username: String,
    password: String,
    sender_email: String
});

export default mongoose.model('Config', configSchema);