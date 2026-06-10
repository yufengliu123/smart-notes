const express = require('express');
const crypto = require('crypto');
const Joi = require('joi');
const md5 = v => crypto.createHash('md5').update(v).digest('hex');
const { Op } = require('sequelize');
const { Note } = require('../models');
const { generateSummary, extractSections } = require('../services/aiService');
const auth = require('../middleware/auth');

const router = express.Router();

const noteSchema = Joi.object({
  title: Joi.string().max(200).required(),
  content: Joi.string().allow(''),
  category: Joi.string().max(100),
  tags: Joi.string().max(500),
  is_public: Joi.boolean()
});

router.post('/', auth, async (req, res) => {
  try {
    const { error, value } = noteSchema.validate(req.body);
    if (error) return res.status(400).json({ code: 400, message: error.details[0].message });
    const note = await Note.create({ ...value, user_id: req.user.userId });
    console.log('Note created, id:', note.id, 'user_id:', note.user_id);
    if (value.content && value.content.length > 50) {
      const aiResult = await generateSummary(value.content);
      if (aiResult) await note.update({ summary: aiResult.summary, keywords: aiResult.keywords });
    }
    const result = await Note.findByPk(note.id);
    res.status(201).json({ code: 201, message: '笔记创建成功', data: result });
  } catch (err) {
    console.error('Create note error:', err);
    res.status(500).json({ code: 500, message: '创建笔记失败', error: err.message });
  }
});

const mindmapCache = new Map();

router.get('/:id/sections', auth, async (req, res) => {
  try {
    const note = await Note.findOne({ where: { id: req.params.id, user_id: req.user.userId } });
    if (!note) return res.status(404).json({ code: 404, message: '笔记不存在' });
    const content = note.content || '';
    if (!content || content.length < 50) return res.json({ code: 200, data: [] });
    if (mindmapCache.has(note.id)) {
      const cached = mindmapCache.get(note.id);
      if (cached.md5 === md5(content)) return res.json({ code: 200, data: cached.sections });
    }
    const sections = await extractSections(content);
    mindmapCache.set(note.id, { md5: md5(content), sections });
    res.json({ code: 200, data: sections });
  } catch (err) {
    res.status(500).json({ code: 500, message: '生成分支失败', error: err.message });
  }
});

router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, pageSize = 100, category, keyword } = req.query;
    const where = { user_id: req.user.userId };
    if (category) where.category = category;
    if (keyword) where.title = { [Op.like]: `%${keyword}%` };
    const { count, rows } = await Note.findAndCountAll({
      where, offset: (page - 1) * pageSize, limit: parseInt(pageSize), order: [['updated_at', 'DESC']]
    });
    console.log('GET /notes where:', JSON.stringify(where));
    console.log('GET /notes rows count:', rows.length, 'total:', count);
    res.json({ code: 200, data: { list: rows, total: count, page: parseInt(page), pageSize: parseInt(pageSize) } });
  } catch (err) {
    res.status(500).json({ code: 500, message: '查询笔记失败', error: err.message });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const note = await Note.findOne({ where: { id: req.params.id, user_id: req.user.userId } });
    if (!note) return res.status(404).json({ code: 404, message: '笔记不存在' });
    res.json({ code: 200, data: note });
  } catch (err) {
    res.status(500).json({ code: 500, message: '查询笔记失败', error: err.message });
  }
});

router.put('/:id', auth, async (req, res) => {
  try {
    const note = await Note.findOne({ where: { id: req.params.id, user_id: req.user.userId } });
    if (!note) return res.status(404).json({ code: 404, message: '笔记不存在' });
    const { error, value } = noteSchema.validate(req.body);
    if (error) return res.status(400).json({ code: 400, message: error.details[0].message });
    await note.update(value);
    if (value.content && value.content.length > 50) {
      const aiResult = await generateSummary(value.content);
      if (aiResult) await note.update({ summary: aiResult.summary, keywords: aiResult.keywords });
    }
    res.json({ code: 200, message: '笔记更新成功', data: note });
  } catch (err) {
    res.status(500).json({ code: 500, message: '更新笔记失败', error: err.message });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const note = await Note.findOne({ where: { id: req.params.id, user_id: req.user.userId } });
    if (!note) return res.status(404).json({ code: 404, message: '笔记不存在' });
    await note.destroy();
    res.json({ code: 200, message: '删除成功' });
  } catch (err) {
    res.status(500).json({ code: 500, message: '删除笔记失败', error: err.message });
  }
});

module.exports = router;