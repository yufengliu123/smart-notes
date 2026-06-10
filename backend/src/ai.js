const axios = require('axios');

const DEEPSEEK_API_URL = process.env.DEEPSEEK_API_URL;
const API_KEY = process.env.DEEPSEEK_API_KEY;

async function callDeepSeek(prompt) {
  const response = await axios.post(
    DEEPSEEK_API_URL,
    {
      model: "deepseek-chat",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.8,
    },
    {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Content-Type': 'application/json',
      },
    }
  );
  return response.data.choices[0].message.content;
}

async function generateWordSet(category = '日常物品') {
  const prompt = `你是一个聚会游戏设计师。请生成一组"谁是卧底"游戏词汇。
类别：${category}
要求：
- 平民词是一个具体名词
- 卧底词是与平民词相近但不同的另一个名词
- 两个词属于同一范畴，难度中等
输出纯JSON格式，不要有其他解释文字，例如：
{"civilianWord":"西瓜","spyWord":"冬瓜"}`;

  const result = await callDeepSeek(prompt);
  try {
    return JSON.parse(result);
  } catch (e) {
    return { civilianWord: "电脑", spyWord: "笔记本" };
  }
}

module.exports = { generateWordSet };
