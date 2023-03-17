const jwt = require('jsonwebtoken');
const User = require('../models/user');

const JWT_SECRET = 'secret'

// Controller function for user registration
exports.register = async (req, res) => {
  try {
    adduser = req.body
    username = adduser.username
    // Check if the username is already registered
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.status(409).json({ message: 'username already registered' });
    }
    const newUser = new User(adduser);
    // Create a new user with the given username and password;
    const user = await newUser.save();
    await user.save();
    console.log(user)
    // Generate a JWT token and send it in the response
    const token = jwt.sign({ userId: user._id, username: user.username }, JWT_SECRET);
    res.json({ status: "success", message: 'Registration successful' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// Controller function for user login
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;
    // Find the user with the given username
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(401).json({ message: 'Authentication failed' });
    }
    // Check if the password matches
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Authentication failed' });
    }
    // Generate a JWT token and send it in the response
    console.log(user)
    const token = jwt.sign({ userId: user._id, username: user.username }, JWT_SECRET);
    // return res.json({ token });
    return res.cookie('auth', token, { httpOnly: true }).json({ status: "success", message: 'Authentication successful' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// Controller function for verifying JWT token
exports.verifyToken = async (req, res, next) => {
  try {
    // Get the token from the Authorization header
    const token = req.cookies.auth;
    if (!token) {
      return res.status(401).json({ status: "error", message: 'Authentication failed. No token supplied' });
    }
    // Verify the token
    const decoded = jwt.verify(token, JWT_SECRET);
    if(decoded) {
        const user = await User.findOne({ _id: decoded.userId });
        if (!user) {
            return res.status(401).json({ status: "error", message: 'Authentication failed. Invalid token.' });
        }
        else {
            console.log(user);
            req.userId = decoded.userId;
            next();
        }
    }
  } catch (err) {
    console.error(err);
    res.status(401).json({ status: "error", message: 'Authentication failed. Invalid token.' });
  }
};
