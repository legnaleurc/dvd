import { loadActionList, saveActionList } from '@/lib/storage';


describe('storage', () => {

  beforeEach(() => {
    localStorage.clear();
  });

  describe('loadActionList', () => {

    it('should get null from first call', () => {
      const rv = loadActionList();
      expect(rv).toBeNull();
    });

    it('should get data from `actionList`', () => {
      const expected = {
        video: 'vlc',
      };
      localStorage.setItem('actionList', JSON.stringify(expected));
      const rv = loadActionList();
      expect(rv).toEqual(expected);
    });

  });

  describe('saveActionList', () => {

    it('should set data to `actionList`', () => {
      const expected = {
        audio: 'vlc',
      };
      saveActionList(expected);
      const rv = localStorage.getItem('actionList');
      expect(rv).not.toBeNull();
      expect(JSON.parse(rv!)).toEqual(expected);
    });

  });

});
