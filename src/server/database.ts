import * as Sequelize from 'sequelize';
import { TrackInfo } from '../common/track';

export const sequelize = new Sequelize('music', 'music', 'music', {
    dialect: 'sqlite',
    operatorsAliases: Sequelize.Op, // use Sequelize.Op

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
    storage: 'data/database.sqlite'
  }as any);
  
export const Tracks = sequelize.define<TrackInfo, any>('tracks', {
  artist: Sequelize.STRING,
  title: Sequelize.STRING,
  name: Sequelize.STRING,
  rating: Sequelize.INTEGER,
  duration: Sequelize.STRING,
  url: Sequelize.STRING,
}, {
    charset: 'utf8',
    collate: 'utf8_unicode_ci'
});

