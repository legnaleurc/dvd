import React from 'react';
import { act, renderHook } from '@testing-library/react-hooks';

import {
  FullScreenProvider,
  useFullScreenAction,
  useFullScreenState,
} from '@/views/hooks/fullscreen';


describe('fullscreen', () => {

  describe('<FullScreenProvider />', () => {

    const Root: React.FC = ({ children }) => {
      return (
        <FullScreenProvider>
          {children}
        </FullScreenProvider>
      );
    };

    function renderFullScreenHook () {
      return renderHook(() => ({
        state: useFullScreenState(),
        action: useFullScreenAction(),
      }), {
        wrapper: Root,
      });
    }

    it('can toggle fullscreen', () => {
      const { result } = renderFullScreenHook();
      const actions = result.current.action;

      expect(result.current.state.fullScreen).toBeFalsy();

      act(() => {
        result.current.action.toggleFullScreen();
      });
      expect(result.current.state.fullScreen).toBeTruthy();

      act(() => {
        result.current.action.toggleFullScreen();
      });
      expect(result.current.state.fullScreen).toBeFalsy();

      expect(result.current.action).toMatchObject(actions);
    });

    it('can leave fullscreen', () => {
      const { result } = renderFullScreenHook();
      const actions = result.current.action;

      expect(result.current.state.fullScreen).toBeFalsy();

      act(() => {
        result.current.action.leaveFullScreen();
      });
      expect(result.current.state.fullScreen).toBeFalsy();

      act(() => {
        result.current.action.toggleFullScreen();
      });
      expect(result.current.state.fullScreen).toBeTruthy();

      act(() => {
        result.current.action.leaveFullScreen();
      });
      expect(result.current.state.fullScreen).toBeFalsy();

      expect(result.current.action).toMatchObject(actions);
    });

  });

});
