const jwt = require('jsonwebtoken');
const User = require('../models/user');


const protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Attach user info to req
      req.user = await User.findById(decoded.userId).select('-password');
      next();

    } catch (error) {
      return res.status(401).json({ message: 'Token failed or invalid' });
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }
};

module.exports = protect;
