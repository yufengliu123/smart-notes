const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const User = sequelize.define('User', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  username: { type: DataTypes.STRING(50), allowNull: false, unique: true },
  email: { type: DataTypes.STRING(100), allowNull: false, unique: true },
  password_hash: { type: DataTypes.STRING(255), allowNull: false },
  avatar_url: { type: DataTypes.STRING(500) }
}, { tableName: 'users', timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at' });

const Note = sequelize.define('Note', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  user_id: { type: DataTypes.INTEGER, allowNull: false },
  title: { type: DataTypes.STRING(200), allowNull: false },
  content: { type: DataTypes.TEXT },
  summary: { type: DataTypes.TEXT },
  keywords: { type: DataTypes.STRING(500) },
  category: { type: DataTypes.STRING(100) },
  tags: { type: DataTypes.STRING(500) },
  is_public: { type: DataTypes.BOOLEAN, defaultValue: false }
}, { tableName: 'notes', timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at' });

const NoteRelation = sequelize.define('NoteRelation', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  source_note_id: { type: DataTypes.INTEGER, allowNull: false },
  target_note_id: { type: DataTypes.INTEGER, allowNull: false },
  relation_type: { type: DataTypes.STRING(50), defaultValue: 'related' },
  weight: { type: DataTypes.FLOAT, defaultValue: 0.5 }
}, { tableName: 'note_relations', timestamps: true, createdAt: 'created_at', updatedAt: false });

const ReviewSchedule = sequelize.define('ReviewSchedule', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  user_id: { type: DataTypes.INTEGER, allowNull: false },
  note_id: { type: DataTypes.INTEGER, allowNull: false },
  ease_factor: { type: DataTypes.FLOAT, defaultValue: 2.5 },
  interval_days: { type: DataTypes.INTEGER, defaultValue: 1 },
  repetitions: { type: DataTypes.INTEGER, defaultValue: 0 },
  next_review_date: { type: DataTypes.DATE, allowNull: false },
  last_reviewed_at: { type: DataTypes.DATE }
}, { tableName: 'review_schedules', timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at' });

const ReviewLog = sequelize.define('ReviewLog', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  schedule_id: { type: DataTypes.INTEGER, allowNull: false },
  user_id: { type: DataTypes.INTEGER, allowNull: false },
  note_id: { type: DataTypes.INTEGER, allowNull: false },
  quality: { type: DataTypes.INTEGER, allowNull: false }
}, { tableName: 'review_logs', timestamps: true, createdAt: 'created_at', updatedAt: false });

const KnowledgeNode = sequelize.define('KnowledgeNode', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  note_id: { type: DataTypes.INTEGER, allowNull: false },
  node_type: { type: DataTypes.STRING(50), defaultValue: 'concept' },
  node_name: { type: DataTypes.STRING(200), allowNull: false },
  node_properties: { type: DataTypes.JSON }
}, { tableName: 'knowledge_nodes', timestamps: true, createdAt: 'created_at', updatedAt: false });

const Feedback = sequelize.define('Feedback', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  user_id: { type: DataTypes.INTEGER, allowNull: false },
  content: { type: DataTypes.TEXT, allowNull: false },
  type: { type: DataTypes.STRING(20), defaultValue: 'suggestion' },
  status: { type: DataTypes.STRING(20), defaultValue: 'pending' }
}, { tableName: 'feedbacks', timestamps: true, createdAt: 'created_at', updatedAt: 'updated_at' });

User.hasMany(Note, { foreignKey: 'user_id', as: 'notes' });
User.hasMany(Feedback, { foreignKey: 'user_id', as: 'feedbacks' });
Feedback.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
Note.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
Note.hasMany(NoteRelation, { foreignKey: 'source_note_id', as: 'outgoingRelations' });
Note.hasMany(NoteRelation, { foreignKey: 'target_note_id', as: 'incomingRelations' });
Note.hasMany(ReviewSchedule, { foreignKey: 'note_id', as: 'reviewSchedules' });
ReviewSchedule.belongsTo(Note, { foreignKey: 'note_id', as: 'note' });
User.hasMany(ReviewSchedule, { foreignKey: 'user_id', as: 'reviewSchedules' });
ReviewSchedule.hasMany(ReviewLog, { foreignKey: 'schedule_id', as: 'logs' });
Note.hasMany(KnowledgeNode, { foreignKey: 'note_id', as: 'knowledgeNodes' });

module.exports = { sequelize, User, Note, NoteRelation, ReviewSchedule, ReviewLog, KnowledgeNode, Feedback };