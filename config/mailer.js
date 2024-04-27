import nodemailer from "nodemailer";

export const sendEmail = async (to, emailToken) => {
    const verificationLink = `http://localhost:3000/auth/verify-email?token=${emailToken}`;

    try {
        let transporter = nodemailer.createTransport({
            service: "gmail",
            host: "smtp.gmail.com",
            port: 587,
            secure: false,
            auth: {
                user: process.env.EMAIL_USERNAME,
                pass: process.env.EMAIL_PASSWORD
            }
        });

        await transporter.sendMail({
            from: process.env.EMAIL_USERNAME,
            to,
            subject: "Verify Email",
            html: `
                <p>Hallo</p>
                <p>Terima kasih telah mendaftar di Durian Pak Jayus. Untuk melanjutkan, silakan verifikasi alamat email Anda dengan mengeklik tautan di bawah ini:</p>
                <a href="${verificationLink}">Verifikasi Email</a>
                <p>Jika Anda tidak mendaftar, abaikan pesan ini.</p>
                <p>Terima kasih.</p>
                <p>Tim Durian Pak Jayus</p>
            `,
        });

        console.log("Email sent successfully");
    } catch (error) {
        console.error("Error sending email:", error.message);
    }
};

export const sendResetPasswordEmail = async (email, token) => {
    const resetPasswordLink = `http://localhost:3000/auth/reset-password/${token}`
    try {
        let transporter = nodemailer.createTransport({
            service: "gmail",
            host: "smtp.gmail.com",
            port: 587,
            secure: false,
            auth: {
                user: process.env.EMAIL_USERNAME,
                pass: process.env.EMAIL_PASSWORD
            }
        });

        const mailOptions = {
            from: process.env.EMAIL_USERNAME,
            to: email,
            subject: 'Reset Password',
            html: `
                <p>Halo</p>
                <p>Anda menerima email ini karena kami menerima permintaan untuk mereset kata sandi akun Anda. Silakan klik tautan di bawah ini untuk melanjutkan proses reset password:</p>
                <a href="${resetPasswordLink}">Reset Password</a>
                <p>Jika Anda tidak meminta reset password, abaikan pesan ini. Akun Anda tetap aman.</p>
                <p>Terima kasih.</p>
                <p>Tim Durian Pak Jayus</p>
            `,
        };

        await transporter.sendMail(mailOptions);
        console.log('Reset password email sent successfully');
    } catch (error) {
        console.error('Error sending reset password email:', error);
        throw new Error('Failed to send reset password email');
    }
};
