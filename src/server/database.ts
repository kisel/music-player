import * as Sequelize from 'sequelize';
import { TrackInfo } from '../common/track';

export function getDatabaseStorage() {
  return process.env['DATABASE'] || 'data/database.sqlite';
}

export const sequelize = new Sequelize('music', 'music', 'music', {
    dialect: 'sqlite',
    operatorsAliases: Sequelize.Op, // use Sequelize.Op

    //logging: false,

    pool: {
      max: 5,
      min: 0,
      idle: 10000
    },

  define: {
    charset: 'utf8',
    dialectOptions: {
      collate: 'utf8_general_ci'
    },
    timestamps: true
  } as any,

    // SQLite only
    storage: getDatabaseStorage()
  }as any);
  
export const Tracks = sequelize.define<TrackInfo, any>('tracks', {
  artist: Sequelize.STRING,
  title: Sequelize.STRING,
  name: Sequelize.STRING,
  rating: Sequelize.INTEGER,
  duration: Sequelize.INTEGER,
  path: Sequelize.STRING,
  meta: Sequelize.JSON,
  playStart: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
  playSkip: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
  playEnd: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
  lastPlayed: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
  deleted: Sequelize.DATE,
}, {
    charset: 'utf8',
    collate: 'utf8_unicode_ci'
});

