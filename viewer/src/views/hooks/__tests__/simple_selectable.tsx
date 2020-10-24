import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import {
  SimpleSelectableProvider,
  useSimpleSelectableAction,
  useSimpleSelectableState,
} from '@/views/hooks/simple_selectable';


describe('simple_selectable', () => {

  describe('<SimpleSelectableProvider />', () => {

    function Root (props: { actionStub: () => void }) {
      return (
        <SimpleSelectableProvider>
          <Action stub={props.actionStub} />
          <State />
        </SimpleSelectableProvider>
      );
    }

    function Action (props: { stub: () => void }) {
      const { toggle, clear } = useSimpleSelectableAction();

      const onToggleClicked = makeEventHandler((event) => {
        toggle(event.currentTarget.dataset['id']!);
      }, [toggle]);

      React.useEffect(() => {
        props.stub();
      }, [props.stub, toggle, clear]);

      return (
        <>
          <button
            aria-label="toggle"
            onClick={onToggleClicked}
          />
          <button aria-label="clear" onClick={clear} />
        </>
      );
    }

    function State (props: {}) {
      const { dict, count } = useSimpleSelectableState();
      return (
        <>
          <input type="text" readOnly={true} value={JSON.stringify(dict)} />
          <input type="number" readOnly={true} value={count} />
        </>
      );
    }

    function toggle (id: string) {
      const btn = screen.getByRole('button', { name: 'toggle' });
      btn.dataset['id'] = id;
      userEvent.click(btn);
    }

    function clear () {
      const btn = screen.getByRole('button', { name: 'clear' });
      userEvent.click(btn);
    }

    function dict () {
      return screen.getByRole('textbox');
    }

    function count () {
      return screen.getByRole('spinbutton');
    }

    it('can modify selection', () => {
      const actionStub = jest.fn();
      render(<Root actionStub={actionStub} />);

      expect(actionStub).toHaveBeenCalledTimes(1);
      expect(dict()).toHaveValue(JSON.stringify({}));
      expect(count()).toHaveValue(0);

      toggle('1');
      expect(actionStub).toHaveBeenCalledTimes(1);
      expect(dict()).toHaveValue(JSON.stringify({'1': true}));
      expect(count()).toHaveValue(1);

      toggle('2');
      expect(actionStub).toHaveBeenCalledTimes(1);
      expect(dict()).toHaveValue(JSON.stringify({'1': true, '2': true}));
      expect(count()).toHaveValue(2);

      toggle('1');
      expect(actionStub).toHaveBeenCalledTimes(1);
      expect(dict()).toHaveValue(JSON.stringify({'2': true}));
      expect(count()).toHaveValue(1);

      toggle('2');
      expect(actionStub).toHaveBeenCalledTimes(1);
      expect(dict()).toHaveValue(JSON.stringify({}));
      expect(count()).toHaveValue(0);
    });

    it('can clear selection', () => {
      const actionStub = jest.fn();
      render(<Root actionStub={actionStub} />);

      expect(actionStub).toHaveBeenCalledTimes(1);
      expect(dict()).toHaveValue(JSON.stringify({}));
      expect(count()).toHaveValue(0);

      toggle('1');
      toggle('2');
      clear();
      expect(actionStub).toHaveBeenCalledTimes(1);
      expect(dict()).toHaveValue(JSON.stringify({}));
      expect(count()).toHaveValue(0);
    });

  });

  type EventHandler = (event: React.MouseEvent<HTMLButtonElement>) => void;
  function makeEventHandler<T extends readonly unknown[]> (handler: EventHandler, dependencies: readonly [...T]) {
    return React.useCallback(handler, dependencies);
  }

});
