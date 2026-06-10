const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const winston = require('winston');
const { sequelize } = require('./models');

dotenv.config();

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(winston.format.timestamp(), winston.format.json()),
  transports: [new winston.transports.Console(), new winston.transports.File({ filename: 'logs/error.log', level: 'error' }), new winston.transports.File({ filename: 'logs/app.log' })]
});

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => { logger.info(`${req.method} ${req.path}`); next(); });

app.use('/api/auth', require('./routes/auth'));
app.use('/api/notes', require('./routes/notes'));
app.use('/api/graph', require('./routes/graph'));
app.use('/api/review', require('./routes/review'));
app.use('/api/feedback', require('./routes/feedback'));

app.use((err, req, res, next) => { logger.error(err.stack); res.status(500).json({ code: 500, message: '服务器内部错误', error: err.message }); });

async function start() {
  try {
    await sequelize.authenticate();
    logger.info('数据库连接成功');
    await sequelize.sync({ force: false });
    logger.info('数据表同步完成');
    app.listen(process.env.PORT || 3000, () => { logger.info(`服务器运行在端口 ${process.env.PORT || 3000}`); });
  } catch (error) {
    logger.error('数据库连接失败:', error);
  }
}

start();
module.exports = app;