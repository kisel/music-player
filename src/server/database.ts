import { Sequelize } from 'sequelize';
import { TrackInfo } from '../common/track';
import { SearchExpression, ConfigRecord } from '../common/api_calls';

if (!process.env.DATABASE_URL) {
    console.log("DATABASE_URL not set");
    process.exit(1);
}

export const sequelize = new Sequelize(process.env.DATABASE_URL);
  
export const Tracks = sequelize.define<TrackInfo, any>('tracks', {
  artist: Sequelize.STRING,
  title: Sequelize.STRING,
  name: Sequelize.STRING,
  rating: Sequelize.INTEGER,
  duration: Sequelize.INTEGER,
  path: { type: Sequelize.STRING, unique: true },
  meta: Sequelize.JSON,
  playStart: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
  playSkip: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
  playEnd: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
  lastPlayed: Sequelize.DATE,
  mtime: Sequelize.DATE,
  deleted: Sequelize.DATE,
}, {
    charset: 'utf8',
    collate: 'utf8_unicode_ci'
});

export const SearchHistory = sequelize.define<SearchExpression, any>('search_history', {
  expression: { type: Sequelize.STRING, unique: true },
}, {
    charset: 'utf8',
    collate: 'utf8_unicode_ci'
});

export const ConfigStorage = sequelize.define<ConfigRecord, any>('config', {
  key: { type: Sequelize.STRING, unique: true, primaryKey: true },
  data: Sequelize.JSON,
});
