
const express = require('express');
const authenticateToken = require('../middleware/authenticateToken');

function createAuthRouter(authController) {
  const router = express.Router();

  router.post('/register', authController.register);
  router.post('/login', authController.login);
  router.post('/logout', authController.logout);
  router.get('/me', authenticateToken, authController.me);

  return router;
}

module.exports = createAuthRouter;
