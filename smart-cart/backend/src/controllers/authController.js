
function createAuthController(authService) {
  const cookieName = 'smart_cart_token';

  function setAuthCookie(res, token) {
    const maxAge = Number(process.env.JWT_COOKIE_EXPIRES_MS) || 900000;

    res.cookie(cookieName, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge,
      path: '/',
    });
  }

  async function register(req, res, next) {
    try {
      const { user, token } = await authService.register(req.body);
      setAuthCookie(res, token);

      return res.status(201).json({
        message: 'Account created successfully',
        user,
      });
    } catch (error) {
      next(error);
    }
  }

  async function login(req, res, next) {
    try {
      const { user, token } = await authService.login(req.body);
      setAuthCookie(res, token);

      return res.status(200).json({
        message: 'Login successful',
        user,
      });
    } catch (error) {
      next(error);
    }
  }

  function logout(req, res) {
    res.clearCookie(cookieName, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });

    return res.json({ message: 'Logged out successfully' });
  }

  async function me(req, res, next) {
    try {
      const user = await authService.getUserById(req.user.id);

      if (!user) {
        return res.status(401).json({
          message: 'User no longer exists',
        });
      }

      return res.json({ user });
    } catch (error) {
      next(error);
    }
  }

  return { register, login, logout, me };
}

module.exports = createAuthController;
