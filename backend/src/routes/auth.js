const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Joi = require('joi');
const { User } = require('../models');

const router = express.Router();

const registerSchema = Joi.object({
  username: Joi.string().alphanum().min(3).max(30).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required()
});

router.post('/register', async (req, res) => {
  try {
    const { error, value } = registerSchema.validate(req.body);
    if (error) return res.status(400).json({ code: 400, message: error.details[0].message });

    const existingEmail = await User.findOne({ where: { email: value.email } });
    if (existingEmail) return res.status(409).json({ code: 409, message: '邮箱已注册' });

    const existingUsername = await User.findOne({ where: { username: value.username } });
    if (existingUsername) return res.status(409).json({ code: 409, message: '用户名已被占用' });

    const password_hash = await bcrypt.hash(value.password, 6);
    const user = await User.create({ ...value, password_hash });
    res.status(201).json({ code: 201, message: '注册成功', data: { id: user.id, username: user.username, email: user.email } });
  } catch (err) {
    res.status(500).json({ code: 500, message: '注册失败', error: err.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, username, password } = req.body;
    if (!password) return res.status(400).json({ code: 400, message: '密码不能为空' });

    if (!email && !username) return res.status(400).json({ code: 400, message: '请输入邮箱或用户名' });

    let user;
    if (email) {
      user = await User.findOne({ where: { email } });
    } else if (username) {
      user = await User.findOne({ where: { username } });
    }

    if (!user) return res.status(401).json({ code: 401, message: '用户不存在' });

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) return res.status(401).json({ code: 401, message: '密码错误' });

    const token = jwt.sign({ userId: user.id, username: user.username }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });
    res.json({ code: 200, message: '登录成功', data: { token, user: { id: user.id, username: user.username, email: user.email, avatar_url: user.avatar_url } } });
  } catch (err) {
    res.status(500).json({ code: 500, message: '登录失败', error: err.message });
  }
});

router.get('/me', require('../middleware/auth'), async (req, res) => {
  const user = await User.findByPk(req.user.userId, { attributes: { exclude: ['password_hash'] } });
  res.json({ code: 200, data: user });
});

module.exports = router;