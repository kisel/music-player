import { Tracks } from './../src/server/database';
import { importTracks, readTracksJson, importDir, sanitizeTrackInfo } from './../src/server/find_tracks';
import { expect } from 'chai';
import { TrackInfo } from '../src/common/track';
//import 'mocha';

describe('Database', () => {
  beforeEach(async ()=> {
      await Tracks.sync({force: true}); // cleanup DB
  });

  function buildTrack(chunk: string): Partial<TrackInfo> {
    let trackInfo: TrackInfo = {
      artist: chunk,
      name: chunk,
      title: chunk,
      path: chunk
    };
    // TODO: move to sequelize quote
    return sanitizeTrackInfo(trackInfo);
  }

  it('should escape quotes', async () => {
    await Tracks.create(buildTrack("Artist \'Quote"));
  });

  it('should handle null character', async () => {
    await Tracks.create(buildTrack("WhoopsieNull\u0000<<here"));
  });

  it('should handle ctrl character', async () => {
    await Tracks.create(buildTrack("WhoopsieCtrl\u0001<<here"));
  });

  it('should handle bad tracks', async () => {
    await Tracks.bulkCreate(await readTracksJson("test/tracks-bad.json"));
  });

  it('should handle unicode ctrl characters', async () => {
    await Tracks.bulkCreate(await readTracksJson("test/tracks-unicode-ctrl.json"));
  });

  it('should import directories', async function () {
      this.timeout(30000);
      await importDir('/data/media/music');
  });

  if (false) {

  it('should add tracks one-by-one', async function () {
      await Tracks.sync();
      const tracks = await readTracksJson('data/tracks-orig.json');
      for (const track of tracks) {
        console.log(`======`);
        console.log(JSON.stringify(track));
        console.log(`^^^^^^`);
        console.log(JSON.stringify(track));
        //console.log(`${track.artist} - ${track.title}`);
        await Tracks.create(track);
      }
  });

  it('should return read utf8 tracks', async () => {
      await Tracks.sync();
      await importTracks('data/tracks-orig.json');
  });



  }
});
