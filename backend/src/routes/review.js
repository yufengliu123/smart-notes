const express = require('express');
const { Op } = require('sequelize');
const { Note, ReviewSchedule, ReviewLog } = require('../models');
const auth = require('../middleware/auth');
const { calculateNextReview } = require('../services/reviewService');

const router = express.Router();

router.get('/due', auth, async (req, res) => {
  try {
    console.log('GET /review/due called, user_id:', req.user.userId)
    const schedules = await ReviewSchedule.findAll({
      where: { user_id: req.user.userId },
      include: [{ model: Note, as: 'note', attributes: ['id', 'title', 'summary'] }],
      order: [['next_review_date', 'ASC']]
    });
    console.log('review/due schedules count:', schedules.length, 'schedules:', schedules.map(s => ({ id: s.id, note_id: s.note_id, next_review_date: s.next_review_date })))
    res.json({ code: 200, data: schedules });
  } catch (err) {
    console.error('review/due error:', err);
    res.status(500).json({ code: 500, message: '查询复习计划失败', error: err.message });
  }
});

router.post('/schedule/:noteId', auth, async (req, res) => {
  try {
    const note = await Note.findOne({ where: { id: req.params.noteId, user_id: req.user.userId } });
    if (!note) return res.status(404).json({ code: 404, message: '笔记不存在' });
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    const [schedule, created] = await ReviewSchedule.findOrCreate({
      where: { user_id: req.user.userId, note_id: note.id },
      defaults: { next_review_date: tomorrow + 'T00:00:00.000Z' }
    });
    res.json({ code: 200, message: created ? '复习计划已创建' : '复习计划已存在', data: schedule });
  } catch (err) {
    res.status(500).json({ code: 500, message: '创建复习计划失败', error: err.message });
  }
});

router.post('/review/:scheduleId', auth, async (req, res) => {
  try {
    const { quality } = req.body;
    if (quality < 0 || quality > 5) return res.status(400).json({ code: 400, message: '评分需在0-5之间' });
    const schedule = await ReviewSchedule.findOne({ where: { id: req.params.scheduleId, user_id: req.user.userId } });
    if (!schedule) return res.status(404).json({ code: 404, message: '复习计划不存在' });
    const updated = calculateNextReview(schedule, quality);
    await schedule.update(updated);
    await ReviewLog.create({ schedule_id: schedule.id, user_id: req.user.userId, note_id: schedule.note_id, quality });
    res.json({ code: 200, message: '复习记录已保存', data: schedule });
  } catch (err) {
    res.status(500).json({ code: 500, message: '提交复习结果失败', error: err.message });
  }
});

router.get('/stats', auth, async (req, res) => {
  try {
    const totalNotes = await Note.count({ where: { user_id: req.user.userId } });
    const scheduledNotes = await ReviewSchedule.count({ where: { user_id: req.user.userId } });
    const dueCount = await ReviewSchedule.count({ where: { user_id: req.user.userId, next_review_date: { [Op.lte]: new Date() } } });
    const reviewLogs = await ReviewLog.count({ where: { user_id: req.user.userId } });
    const todayStart = new Date(); todayStart.setHours(0,0,0,0);
    const todayReviews = await ReviewLog.count({ where: { user_id: req.user.userId, created_at: { [Op.gte]: todayStart } } });
    res.json({ code: 200, data: { totalNotes, scheduledNotes, dueCount, reviewLogs, todayReviews } });
  } catch (err) {
    res.status(500).json({ code: 500, message: '获取统计数据失败', error: err.message });
  }
});

router.delete('/schedule/:scheduleId', auth, async (req, res) => {
  try {
    const schedule = await ReviewSchedule.findOne({ where: { id: req.params.scheduleId, user_id: req.user.userId } });
    if (!schedule) return res.status(404).json({ code: 404, message: '复习计划不存在' });
    await schedule.destroy();
    res.json({ code: 200, message: '复习计划已移除' });
  } catch (err) {
    res.status(500).json({ code: 500, message: '移除复习计划失败', error: err.message });
  }
});

module.exports = router;