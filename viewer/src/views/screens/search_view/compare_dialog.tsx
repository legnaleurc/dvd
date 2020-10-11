import React from 'react';
import { Dialog } from '@material-ui/core';

import { useContext } from './hooks';
import { CompareResult } from './types';


interface IProps {
  open: boolean;
  onClose: () => void;
}
export function CompareDialog (props: IProps) {
  const { open, onClose } = props;
  const { diff } = useContext();
  return (
    <Dialog
      open={open}
      onClose={onClose}
    >
      <InnerCompareList diff={diff} />
    </Dialog>
  );
}


interface IInnerCompareList {
  diff: CompareResult[] | null;
}
function InnerCompareList (props: IInnerCompareList): JSX.Element {
  if (!props.diff) {
    return <React.Fragment />;
  }
  if (props.diff.length <= 0) {
    return <>OK</>;
  }
  return (
    <>
      {props.diff.map(({path, size}, i) => (
        <pre key={i}>
          {`${size}: ${path}`}
        </pre>
      ))}
    </>
  );
}
