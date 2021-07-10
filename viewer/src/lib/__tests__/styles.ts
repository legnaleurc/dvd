import { CSSProperties } from '@material-ui/core/styles/withStyles';

import { getMixins } from '@/lib/styles';


describe('styles', () => {

  describe('getMixins', () => {

    it('should return empty object with empty input', () => {
      const rv = getMixins([]);
      expect(rv).toEqual({});
    });

    it('should should set currect properties', () => {
      let rv = getMixins([
        'hbox',
        'size-grow',
        'w-100',
        'h-100',
        'mh-0',
        'scrollable',
      ]);
      let excpected: CSSProperties = {
        display: 'flex',
        flex: 'auto',
        width: '100%',
        height: '100%',
        minHeight: 0,
        overflow: 'auto',
      };
      expect(rv).toEqual(excpected);

      rv = getMixins([
        'vbox',
        'size-shrink',
        'w-50',
        'no-scroll',
        'y-scroll',
      ]);
      excpected = {
        display: 'flex',
        flexDirection: 'column',
        flex: '0 0 auto',
        width: '50%',
        overflow: 'hidden',
        overflowY: 'auto',
      };
      expect(rv).toEqual(excpected);
    });

  });

});
