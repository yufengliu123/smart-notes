const axios = require('axios');
require('dotenv').config();

function cleanContentForAI(content) {
  if (!content) return ''
  return content
    .replace(/<img[^>]*>/gi, '')
    .replace(/<image[^>]*>/gi, '')
    .replace(/\!\[.*?\]\(.*?\)/g, '')
    .replace(/data:image\/[^;]+;base64,[^\s]+/g, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

async function generateSummary(content) {
  try {
    const cleanContent = cleanContentForAI(content)
    const response = await axios.post(
      process.env.AI_API_URL,
      {
        model: process.env.AI_MODEL,
        messages: [
          { role: 'system', content: `你是一个专业的笔记摘要助手。请分析以下笔记内容，生成结构化的摘要和关键词。要求输出格式（严格按此JSON格式，不要输出其他内容）：{"summary": "简洁的摘要内容，100字以内","keywords": "关键词1,关键词2,关键词3"}` },
          { role: 'user', content: cleanContent }
        ],
        temperature: 0.7
      },
      { headers: { 'Authorization': `Bearer ${process.env.AI_API_KEY}`, 'Content-Type': 'application/json' } }
    );
    const text = response.data.choices[0]?.message?.content || '';
    const jsonMatch = text.match(/\{[\s\S]*?\}/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]);
    return null;
  } catch (err) {
    console.error('AI摘要生成失败:', err.message);
    return null;
  }
}

async function extractEntities(content) {
  try {
    const cleanContent = cleanContentForAI(content)
    const response = await axios.post(
      process.env.AI_API_URL,
      {
        model: process.env.AI_MODEL,
        messages: [
          { role: 'system', content: `你是一个知识图谱分析助手。请从以下文本中提取实体和概念，输出JSON数组格式：[{"name": "实体名称", "type": "concept|entity|keyword", "properties": {}}]。只输出JSON数组，不要其他内容。` },
          { role: 'user', content: cleanContent }
        ],
        temperature: 0.7
      },
      { headers: { 'Authorization': `Bearer ${process.env.AI_API_KEY}`, 'Content-Type': 'application/json' } }
    );
    const text = response.data.choices[0]?.message?.content || '';
    const jsonMatch = text.match(/\[[\s\S]*?\]/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]);
    return [];
  } catch (err) {
    console.error('AI实体提取失败:', err.message);
    return [];
  }
}

async function extractSections(content) {
  try {
    const cleanContent = cleanContentForAI(content)
    const response = await axios.post(
      process.env.AI_API_URL,
      {
        model: process.env.AI_MODEL,
        messages: [
          { role: 'system', content: `你是一个思维导图助手。请根据笔记正文提取3-6个核心要点，每个要点包含一个简短标题（10字以内）和一句精准描述（20字以内），描述要直接反映原文的核心意思，不要猜测。输出严格JSON数组格式：[{"title": "标题", "desc": "描述"}]，只输出JSON。` },
          { role: 'user', content: cleanContent }
        ],
        temperature: 0.7
      },
      { headers: { 'Authorization': `Bearer ${process.env.AI_API_KEY}`, 'Content-Type': 'application/json' } }
    );
    const text = response.data.choices[0]?.message?.content || '';
    const jsonMatch = text.match(/\[[\s\S]*?\]/);
    if (jsonMatch) return JSON.parse(jsonMatch[0]);
    return [];
  } catch (err) {
    console.error('AI分段失败:', err.message);
    return [];
  }
}

module.exports = { generateSummary, extractEntities, extractSections };