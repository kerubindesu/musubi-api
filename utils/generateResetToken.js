// generateResetToken.js
import jwt from 'jsonwebtoken';

const generateResetToken = (email) => {
  return jwt.sign({ email }, process.env.JWT_RESET_SECRET, { expiresIn: '1h' });
};

export default generateResetToken;