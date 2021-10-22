import React from 'react';

import { useActions } from './hooks';
import { NewMoveItem } from './new_move_item';
import { MoveItem } from './move_item';


export function MoveList (props: {}) {
  const {
    newDestination,
    onDestinationChange,
    addDestination,
    moveList,
    removeDestination,
    updateDestination,
  } = useActions();
  return (
    <div>
      <NewMoveItem
        newDestination={newDestination}
        onDestinationChange={onDestinationChange}
        addDestination={addDestination}
      />
      {moveList.map((destination, index) => (
        <MoveItem
          key={index}
          index={index}
          destination={destination}
          onRemove={removeDestination}
          onUpdate={updateDestination}
        />
      ))}
    </div>
  );
}
