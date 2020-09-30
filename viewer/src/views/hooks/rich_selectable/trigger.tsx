import React from 'react';

import { useInstance } from '@/lib';
import { useRichSelectableAction, useRichSelectableState } from './context';


interface IPureProps {
  nodeId: string;
  toggle: (id: string) => void;
  selectFromLast: (id: string) => void;
}
function PureTrigger (props: React.PropsWithChildren<IPureProps>) {
  const { onClick } = useActions(props);

  return (
    <div
      className="selectable-trigger"
      onClick={onClick}
    >
      {props.children}
    </div>
  );
}
const MemorizedPureTrigger = React.memo(PureTrigger);


function useActions (props: IPureProps) {
  const clickTimer = React.useRef(0);
  const self = useInstance(() => ({
    toggle () {
      props.toggle(props.nodeId);
    },
    multiSelect () {
      props.selectFromLast(props.nodeId);
    },
  }), [props.nodeId, props.toggle, props.selectFromLast]);

  const onClick = React.useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    const count = event.detail;
    const hasShiftKey = event.shiftKey;
    window.clearTimeout(clickTimer.current);
    clickTimer.current = window.setTimeout(() => {
      if (count > 1) {
        return;
      }
      if (hasShiftKey) {
        self.current.multiSelect();
      } else {
        self.current.toggle();
      }
    }, 200);
  }, [self, clickTimer]);

  return {
    onClick,
  };
}


interface IProps {
  nodeId: string;
}
export function Trigger (props: React.PropsWithChildren<IProps>) {
  const { toggle, selectFromLast } = useRichSelectableAction();
  return (
    <MemorizedPureTrigger
      nodeId={props.nodeId}
      toggle={toggle}
      selectFromLast={selectFromLast}
    >
      {props.children}
    </MemorizedPureTrigger>
  );
}
