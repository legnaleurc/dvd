import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { useInstance } from '@/lib/hooks';


describe('hooks', () => {

  describe('useInstance', () => {

    function Block (props: { stub: () => void }) {
      const [hide, setHide] = React.useState(false);
      const self = useInstance(() => ({
        get hide () {
          return hide;
        },
        set hide (v: boolean) {
          setHide(v);
        }
      }), [hide, setHide]);

      const onClick = React.useCallback(() => {
        self.current.hide = !self.current.hide;
      }, [self]);

      React.useEffect(() => {
        props.stub();
      }, [props.stub, onClick]);

      return (
        <>
          <input type="checkbox" readOnly={true} checked={hide} />
          <button onClick={onClick} />
        </>
      );
    }

    it('should not trigger rerender', async () => {
      const stub = jest.fn();
      render(<Block stub={stub} />);

      function input () {
        return screen.getByRole('checkbox');
      }
      function button () {
        return screen.getByRole('button');
      }

      expect(input()).not.toBeChecked();
      expect(stub).toHaveBeenCalledTimes(1);

      userEvent.click(button());
      expect(input()).toBeChecked();
      expect(stub).toHaveBeenCalledTimes(1);

      userEvent.click(button());
      expect(input()).not.toBeChecked();
      expect(stub).toHaveBeenCalledTimes(1);
    });

  });

});
