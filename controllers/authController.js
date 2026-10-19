import jwt from 'jsonwebtoken';
import { registerUser, loginUser, getCurrentUser } from '../services/authService.js';
import { clearToken } from '../utils/jwt.js';

export const register = async (req, res, next) => {
  try {
    const userData = await registerUser(req.body, res);
    res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: userData,
    });
  } catch (error) {
    res.status(400);
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const userData = await loginUser(req.body, res);
    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: userData,
    });
  } catch (error) {
    res.status(401);
    next(error);
  }
};

export const logout = async (req, res) => {
  clearToken(res);
  res.status(200).json({
    success: true,
    message: 'Logged out successfully',
  });
};

export const getMe = async (req, res, next) => {
  try {
    let token = req.cookies?.jwt;

    if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(200).json({
        success: true,
        data: null,
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await getCurrentUser(decoded.id);

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    res.status(200).json({
      success: true,
      data: null,
    });
  }
};
