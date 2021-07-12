import React from 'react';
import { act, renderHook } from '@testing-library/react-hooks';

import {
  SimpleSelectableProvider,
  useSimpleSelectableAction,
  useSimpleSelectableState,
} from '@/views/hooks/simple_selectable';


describe('simple_selectable', () => {

  describe('<SimpleSelectableProvider />', () => {

    const Root: React.FC = ({ children }) => {
      return (
        <SimpleSelectableProvider>
          {children}
        </SimpleSelectableProvider>
      );
    };

    function renderSimpleSelectableHook () {
      return renderHook(() => ({
        state: useSimpleSelectableState(),
        action: useSimpleSelectableAction(),
      }), {
        wrapper: Root,
      });
    }

    it('can modify selection', () => {
      const { result } = renderSimpleSelectableHook();
      const actions = result.current.action;

      expect(result.current.state.dict).toStrictEqual({});
      expect(result.current.state.count).toStrictEqual(0);

      act(() => {
        result.current.action.toggle('1');
      });
      expect(result.current.state.dict).toStrictEqual({
        '1': true,
      });
      expect(result.current.state.count).toStrictEqual(1);

      act(() => {
        result.current.action.toggle('2');
      });
      expect(result.current.state.dict).toStrictEqual({
        '1': true,
        '2': true,
      });
      expect(result.current.state.count).toStrictEqual(2);

      act(() => {
        result.current.action.toggle('1');
      });
      expect(result.current.state.dict).toStrictEqual({
        '2': true,
      });
      expect(result.current.state.count).toStrictEqual(1);

      act(() => {
        result.current.action.toggle('2');
      });
      expect(result.current.state.dict).toStrictEqual({});
      expect(result.current.state.count).toStrictEqual(0);

      expect(result.current.action).toStrictEqual(actions);
    });

    it('can clear selection', () => {
      const { result } = renderSimpleSelectableHook();
      const actions = result.current.action;

      expect(result.current.state.dict).toStrictEqual({});
      expect(result.current.state.count).toStrictEqual(0);

      act(() => {
        result.current.action.toggle('1');
        result.current.action.toggle('2');
        result.current.action.clear();
      });
      expect(result.current.state.dict).toStrictEqual({});
      expect(result.current.state.count).toStrictEqual(0);

      expect(result.current.action).toStrictEqual(actions);
    });

  });

});
