const jwt = require("jsonwebtoken");
const { SECRET_KEY } = require("../config");
const { UnauthorizedError } = require("../expressError");

const authenticateJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  
  if (!authHeader) {
    return next(new UnauthorizedError("Access token missing or invalid."));
  }
  
  const token = authHeader.split(" ")[1]; // Extract the token from header
  
  if (!token) {
    return next(new UnauthorizedError("Access token missing or invalid."));
  }
  
  try {
    const decoded = jwt.verify(token, SECRET_KEY); // Verify token
    
    
    if (!decoded.sub || !decoded.usertype) {
      return next(new UnauthorizedError("Invalid access token."));
    }
    
    req.user = { userID: decoded.sub, usertype: decoded.usertype }; // Set user details
    req.token = token;
    next(); // Proceed to next middleware
  } catch (error) {
    return next(new UnauthorizedError("Invalid access token."));
  }
};


const isAdmin = (req, res, next) => {
  if (req.user && req.user.usertype === "Admin") {
    next();
  } else {
    next(new UnauthorizedError("Unauthorized"));
  }
};

const ensureCorrectUserOrAdmin = (req, res, next) => {
  try {
    const user = req.user;
   
    if (user && (user.userid === req.params.userid || user.usertype === "Admin")) {
      return next();
    } else {
      throw new UnauthorizedError("You are not authorized to access this resource.");
    }
  } catch (err) {
    return next(err);
  }
};

module.exports = {
  authenticateJWT,
  isAdmin,
  ensureCorrectUserOrAdmin,
};
