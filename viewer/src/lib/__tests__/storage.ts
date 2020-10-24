import { getActionList, setActionList } from '@/lib/storage';


describe('storage', () => {

  beforeEach(() => {
    localStorage.clear();
  });

  describe('getActionList', () => {

    it('should get null from first call', () => {
      const rv = getActionList();
      expect(rv).toBeNull();
    });

    it('should get data from `actionList`', () => {
      const expected = {
        video: 'vlc',
      };
      localStorage.setItem('actionList', JSON.stringify(expected));
      const rv = getActionList();
      expect(rv).toEqual(expected);
    });

  });

  describe('setActionList', () => {

    it('should set data to `actionList`', () => {
      const expected = {
        audio: 'vlc',
      };
      setActionList(expected);
      const rv = localStorage.getItem('actionList');
      expect(rv).not.toBeNull();
      expect(JSON.parse(rv!)).toEqual(expected);
    });

  });

});
