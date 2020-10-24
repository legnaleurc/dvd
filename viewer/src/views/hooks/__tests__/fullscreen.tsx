import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import {
  FullScreenProvider,
  useFullScreenAction,
  useFullScreenState,
} from '@/views/hooks/fullscreen';


describe('fullscreen', () => {

  describe('<FullScreenProvider />', () => {

    function Root (props: { actionStub: () => void }) {
      return (
        <FullScreenProvider>
          <Action stub={props.actionStub} />
          <State />
        </FullScreenProvider>
      );
    }

    function Action (props: { stub: () => void }) {
      const { toggleFullScreen, leaveFullScreen } = useFullScreenAction();
      React.useEffect(() => {
        props.stub();
      }, [props.stub, toggleFullScreen, leaveFullScreen]);
      return (
        <>
          <button aria-label="toggle" onClick={toggleFullScreen} />
          <button aria-label="leave" onClick={leaveFullScreen} />
        </>
      );
    }

    function State (props: {}) {
      const { fullScreen } = useFullScreenState();
      return (
        <input type="checkbox" readOnly={true} checked={fullScreen} />
      );
    }

    function toggle () {
      const btn = screen.getByRole('button', { name: 'toggle' });
      userEvent.click(btn);
    }
    function leave () {
      const btn = screen.getByRole('button', { name: 'leave' });
      userEvent.click(btn);
    }
    function checkbox () {
      return screen.getByRole('checkbox');
    }

    it('can toggle fullscreen', () => {
      const actionStub = jest.fn();
      render(<Root actionStub={actionStub} />);

      expect(actionStub).toHaveBeenCalledTimes(1);
      expect(checkbox()).not.toBeChecked();

      toggle();
      expect(actionStub).toHaveBeenCalledTimes(1);
      expect(checkbox()).toBeChecked();

      toggle();
      expect(actionStub).toHaveBeenCalledTimes(1);
      expect(checkbox()).not.toBeChecked();
    });

    it('can leave fullscreen', () => {
      const actionStub = jest.fn();
      render(<Root actionStub={actionStub} />);

      expect(actionStub).toHaveBeenCalledTimes(1);
      expect(checkbox()).not.toBeChecked();

      leave();
      expect(actionStub).toHaveBeenCalledTimes(1);
      expect(checkbox()).not.toBeChecked();

      toggle();
      expect(actionStub).toHaveBeenCalledTimes(1);
      expect(checkbox()).toBeChecked();

      leave();
      expect(actionStub).toHaveBeenCalledTimes(1);
      expect(checkbox()).not.toBeChecked();
    });

  });

});
