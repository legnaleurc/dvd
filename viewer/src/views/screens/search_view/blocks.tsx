import React from 'react';


export function LoadingBlock (props: {}) {
  return <div className="loading-block">SEARCHING</div>;
}


export function EmptyBlock (props: {}) {
  return (
    <div className="empty-block">EMPTY</div>
  );
}
