const passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[@#$%^&+=;!.,])(?=.*[^\w\d]).{8,}$/;

function validatePassword(password) {
    if (!passwordRegex.test(password)) {
        return {
            isValid: false,
            message: "Password harus memenuhi kriteria berikut:\n" +
                "- Minimal 8 karakter\n" +
                "- Setidaknya satu digit\n" +
                "- Setidaknya satu huruf kecil\n" +
                "- Setidaknya satu huruf besar\n" +
                "- Setidaknya satu karakter khusus (@#$%^&+=;!.,)\n" +
                "- Setidaknya satu karakter non-alphanumeric"
        };
    }
    return { isValid: true };
}

export default validatePassword