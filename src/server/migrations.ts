import * as Sequelize from 'sequelize';
import {sequelize, ConfigStorage, Tracks} from './database'
import { TrackInfo } from '../common/track';

const DB_VERSION = 1;
const db_version_selector = {where: {key: "db_version"}};

/** Simple migrations implementation */
export async function migrateDB() {
    const {log} = console;
    const show_error = log;
    await ConfigStorage.sync();
    await Tracks.sync();
    let db_version;
    const version = await ConfigStorage.findOne(db_version_selector);
    const query = sequelize.getQueryInterface();

    if (version) {
        db_version = version.data;
        log(`Current DB version: ${db_version}`)
    }

    if (db_version == undefined) {
        log(`Adding mtime column`);
        await query.addColumn("tracks", "mtime", {type: Sequelize.DATE}).catch(show_error);
    }

    if (db_version <= 9) {
        log(`Adding playStart`);
        for (let key of ["playEnd", "playStart", "playSkip"] as ((keyof TrackInfo)[])) {
            await Tracks.update({ [key]: 0 }, { where: { [key]: null } });
            await query.changeColumn("tracks", key, { type: Sequelize.INTEGER, allowNull: false }).catch(show_error);
        }
    }

    log(`Done`);
    await ConfigStorage.upsert({ key: "db_version", data: DB_VERSION });
}
