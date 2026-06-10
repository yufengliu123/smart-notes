const express = require('express');
const { Op } = require('sequelize');
const { Note, NoteRelation, KnowledgeNode } = require('../models');
const auth = require('../middleware/auth');

const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const notes = await Note.findAll({
      where: { user_id: req.user.userId },
      attributes: ['id', 'title', 'summary', 'keywords', 'category'],
      order: [['updated_at', 'DESC']]
    });
    const relations = await NoteRelation.findAll({
      include: [
        { model: Note, as: 'source', attributes: ['id', 'title'] },
        { model: Note, as: 'target', attributes: ['id', 'title'] }
      ],
      where: { [Op.or]: [{ '$source.user_id$': req.user.userId }, { '$target.user_id$': req.user.userId }] }
    });
    const nodes = notes.map(n => ({ id: n.id, name: n.title, category: n.category || 'default' }));
    const links = relations.map(r => ({ source: r.source_note_id, target: r.target_note_id, relationType: r.relation_type, weight: r.weight }));
    res.json({ code: 200, data: { nodes, links } });
  } catch (err) {
    res.status(500).json({ code: 500, message: '获取知识图谱失败', error: err.message });
  }
});

router.post('/analyze/:noteId', auth, async (req, res) => {
  try {
    const note = await Note.findOne({ where: { id: req.params.noteId, user_id: req.user.userId } });
    if (!note) return res.status(404).json({ code: 404, message: '笔记不存在' });
    const { extractEntities } = require('../services/aiService');
    const entities = await extractEntities(note.content);
    if (entities && entities.length > 0) {
      await KnowledgeNode.destroy({ where: { note_id: note.id } });
      await KnowledgeNode.bulkCreate(entities.map(e => ({ note_id: note.id, node_type: e.type, node_name: e.name, node_properties: e.properties || {} })));
    }
    res.json({ code: 200, message: '分析完成', data: entities });
  } catch (err) {
    res.status(500).json({ code: 500, message: '分析失败', error: err.message });
  }
});

router.post('/relate', auth, async (req, res) => {
  try {
    const { source_note_id, target_note_id, relation_type = 'related', weight = 0.5 } = req.body;
    const source = await Note.findOne({ where: { id: source_note_id, user_id: req.user.userId } });
    const target = await Note.findOne({ where: { id: target_note_id, user_id: req.user.userId } });
    if (!source || !target) return res.status(404).json({ code: 404, message: '笔记不存在' });
    const [relation, created] = await NoteRelation.findOrCreate({
      where: { source_note_id, target_note_id },
      defaults: { relation_type, weight }
    });
    if (!created) await relation.update({ relation_type, weight });
    res.json({ code: 200, message: created ? '关联创建成功' : '关联已更新' });
  } catch (err) {
    res.status(500).json({ code: 500, message: '创建关联失败', error: err.message });
  }
});

module.exports = router;