import * as Sequelize from 'sequelize';
import { TrackInfo } from '../common/track';
import { SearchExpression, ConfigRecord } from '../common/api_calls';

if (!process.env.DATABASE_URL) {
    console.log("DATABASE_URL not set");
    process.exit(1);
}

export const sequelize = new Sequelize(process.env.DATABASE_URL);
  
// TODO: use upgrade to sequelize@6 or use field for snake case column names required for pg
export const Tracks = sequelize.define<TrackInfo, any>('tracks', {
  artist: Sequelize.STRING,
  title: Sequelize.STRING,
  name: Sequelize.STRING,
  rating: Sequelize.INTEGER,
  duration: Sequelize.INTEGER,
  path: { type: Sequelize.STRING, unique: true },
  meta: Sequelize.JSON,
  playStart: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0, field: 'play_start' },
  playSkip: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0, field: 'play_skip' },
  playEnd: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0, field: 'play_end' },
  lastPlayed: { type: Sequelize.DATE, field: 'last_played'},
  mtime: Sequelize.DATE,
  deleted: Sequelize.DATE,
}, {
    charset: 'utf8',
    underscored: true
});

export const SearchHistory = sequelize.define<SearchExpression, any>('search_history', {
  expression: { type: Sequelize.STRING, unique: true },
}, {
    charset: 'utf8',
    underscored: true
});

export const ConfigStorage = sequelize.define<ConfigRecord, any>('config', {
  key: { type: Sequelize.STRING, unique: true, primaryKey: true },
  data: Sequelize.JSON,
}, {
    charset: 'utf8',
    underscored: true
});

