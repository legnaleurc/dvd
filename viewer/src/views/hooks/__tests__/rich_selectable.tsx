import React from 'react';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import {
  RichSelectableProvider,
  RichSelectableArea,
  RichSelectableTrigger,
} from '@/views/hooks/rich_selectable';


describe('rich_selectable', () => {

  describe('<RichSelectableProvider />', () => {

    interface IRoot {
      nodeList: string[];
      getSourceList: (id: string) => string[] | null;
    }
    function Root (props: IRoot) {
      const [revision, setRevision] = React.useState(0);
      const classes = React.useMemo(() => ({
        selected: 'selected',
      }), []);
      const bump = React.useCallback(() => {
        setRevision(revision + 1);
      }, [revision, setRevision]);
      return (
        <RichSelectableProvider
          revision={revision}
          getSourceList={props.getSourceList}
          classes={classes}
        >
          <button onClick={bump} />
          <div role="listbox">
            {props.nodeList.map((nodeId) => (
              <Item key={nodeId} nodeId={nodeId} />
            ))}
          </div>
        </RichSelectableProvider>
      );
    }

    function Item (props: { nodeId: string; }) {
      return (
        <div role="listitem" data-testid={props.nodeId}>
          <RichSelectableArea nodeId={props.nodeId}>
            <RichSelectableTrigger nodeId={props.nodeId}>
              <span>{props.nodeId}</span>
            </RichSelectableTrigger>
          </RichSelectableArea>
        </div>
      );
    }

    function click (id: string) {
      const item = screen.getByText(id);
      userEvent.click(item);
      act(() => {
        jest.runOnlyPendingTimers();
      });
    }

    function doubleClick (id: string) {
      const item = screen.getByText(id);
      userEvent.dblClick(item);
      act(() => {
        jest.runOnlyPendingTimers();
      });
    }

    function shiftClick (id: string) {
      const item = screen.getByText(id);
      userEvent.click(item, {
        shiftKey: true,
      });
      act(() => {
        jest.runOnlyPendingTimers();
      });
    }

    function bumpVersion () {
      const btn = screen.getByRole('button');
      userEvent.click(btn);
    }

    function itemList () {
      return screen.getAllByRole('listitem');
    }

    function isSelected (el: HTMLElement) {
      return el.querySelector('.selected') !== null;
    }

    function isIdSelected (id: string) {
      const el = screen.getByTestId(id);
      return isSelected(el);
    }

    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.runOnlyPendingTimers();
      jest.useRealTimers();
    });

    it('has no selection by default', () => {
      const nodeList = ['1', '2', '3'];
      const getSourceList = (id: string) => {
        return nodeList;
      };
      render((
        <Root
          nodeList={nodeList}
          getSourceList={getSourceList}
        />
      ));

      const rv = itemList().every((item) => !isSelected(item));
      expect(rv).toBeTruthy();
    });

    it('can select items by click', () => {
      const nodeList = ['1', '2', '3'];
      const getSourceList = (id: string) => {
        return nodeList;
      };
      render((
        <Root
          nodeList={nodeList}
          getSourceList={getSourceList}
        />
      ));

      click('1');
      expect(isIdSelected('1')).toBeTruthy();

      click('2');
      expect(isIdSelected('2')).toBeTruthy();

      click('1');
      expect(isIdSelected('1')).toBeFalsy();
    });

    it('should not select items by double click', () => {
      const nodeList = ['1', '2', '3'];
      const getSourceList = (id: string) => {
        return nodeList;
      };
      render((
        <Root
          nodeList={nodeList}
          getSourceList={getSourceList}
        />
      ));

      doubleClick('1');
      expect(isIdSelected('1')).toBeFalsy();

      doubleClick('2');
      expect(isIdSelected('2')).toBeFalsy();

      doubleClick('3');
      expect(isIdSelected('3')).toBeFalsy();
    });

    it('can multi select items by shift-click', () => {
      const nodeList = ['1', '2', '3'];
      const getSourceList = (id: string) => {
        return nodeList;
      };
      render((
        <Root
          nodeList={nodeList}
          getSourceList={getSourceList}
        />
      ));

      click('1');
      shiftClick('3');
      const rv = itemList().every((item) => isSelected(item));
      expect(rv).toBeTruthy();
    });

    it('should clear selection if revision changed', () => {
      const nodeList = ['1', '2', '3'];
      const getSourceList = (id: string) => {
        return nodeList;
      };
      render((
        <Root
          nodeList={nodeList}
          getSourceList={getSourceList}
        />
      ));

      click('1');
      shiftClick('3');
      bumpVersion();
      const rv = itemList().every((item) => !isSelected(item));
      expect(rv).toBeTruthy();
    });

  });

});
