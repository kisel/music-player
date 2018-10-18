import { fixStrEncoding } from "../src/server/find_tracks";
import {expect} from "chai";

describe('Decoder', () => {

  it('should decode win1251', () => {
      expect(fixStrEncoding('Äåêîäèðóé äóõîâíûå ñêðåïû êðàáà èç win1251!')).to.equal("Декодируй духовные скрепы краба из win1251!");
  });

  it('should not decode utf8', () => {
      const str = 'Но utf8 оставь без изменений ;'; 
      expect(fixStrEncoding(str)).to.equal(str);
  });

  it('should not decode ascii', () => {
      const str = 'test string.'; 
      expect(fixStrEncoding(str)).to.equal(str);
  });

});
