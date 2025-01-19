const jwt = require('jsonwebtoken');
const { SECRET_KEY } = require('../config');

function createToken(user) {
  const payload = {
    sub: user.userid,    
    email: user.email,
    
  };
  const token = jwt.sign(payload, SECRET_KEY, { expiresIn: '1h' });
  return token;
}

module.exports = { createToken };
