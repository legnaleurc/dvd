import React from 'react';

import { useActions } from './hooks';
import { NewActionItem } from './new_action_item';
import { ActionItem } from './action_item';


export function ActionList (props: {}) {
  const {
    newCategory,
    onCategoryChange,
    newCommand,
    onCommandChange,
    addAction,
    actionDict,
    removeAction,
    updateAction,
  } = useActions();
  return (
    <div>
      <NewActionItem
        newCategory={newCategory}
        onCategoryChange={onCategoryChange}
        newCommand={newCommand}
        onCommandChange={onCommandChange}
        addAction={addAction}
      />
      {Object.entries(actionDict).map(([category, command]) => (
        <ActionItem
          key={category}
          category={category}
          command={command}
          onRemove={removeAction}
          onUpdate={updateAction}
        />
      ))}
    </div>
  );
}
