const express = require('express');
const Joi = require('joi');
const { Feedback } = require('../models');
const auth = require('../middleware/auth');

const router = express.Router();

const feedbackSchema = Joi.object({
  content: Joi.string().min(1).max(1000).required(),
  type: Joi.string().valid('suggestion', 'bug', 'praise', 'other').default('suggestion')
});

router.post('/', auth, async (req, res) => {
  try {
    const { error, value } = feedbackSchema.validate(req.body);
    if (error) return res.status(400).json({ code: 400, message: error.details[0].message });
    const feedback = await Feedback.create({ ...value, user_id: req.user.userId });
    res.status(201).json({ code: 201, message: '反馈已提交，感谢您的建议', data: feedback });
  } catch (err) {
    console.error('Feedback error:', err);
    res.status(500).json({ code: 500, message: '提交反馈失败', error: err.message });
  }
});

router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, pageSize = 20 } = req.query;
    const { count, rows } = await Feedback.findAndCountAll({
      where: { user_id: req.user.userId },
      offset: (page - 1) * pageSize,
      limit: parseInt(pageSize),
      order: [['created_at', 'DESC']]
    });
    res.json({ code: 200, data: { list: rows, total: count, page: parseInt(page), pageSize: parseInt(pageSize) } });
  } catch (err) {
    res.status(500).json({ code: 500, message: '查询反馈失败', error: err.message });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    console.log('DELETE feedback route hit, id:', req.params.id)
    const feedback = await Feedback.findOne({ where: { id: req.params.id, user_id: req.user.userId } });
    console.log('found:', feedback ? feedback.id : 'null')
    if (!feedback) return res.status(404).json({ code: 404, message: '反馈不存在' });
    await feedback.destroy();
    res.json({ code: 200, message: '删除成功' });
  } catch (err) {
    console.error('Delete feedback error:', err);
    res.status(500).json({ code: 500, message: '删除反馈失败', error: err.message });
  }
});

module.exports = router;