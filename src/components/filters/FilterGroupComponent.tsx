import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useFilter } from '@/contexts/FilterContext';
import { FilterGroup } from '@/types/filters';
import { FilterNodeComponent } from './FilterNodeComponent';

interface FilterGroupComponentProps {
  group: FilterGroup;
}

export function FilterGroupComponent({ group }: FilterGroupComponentProps) {
  const { addCondition, addGroup, removeNode, updateNode } = useFilter();

  const isRoot = group.id === 'root';

  return (
    <div className={`space-y-3 rounded-lg p-4 ${!isRoot ? 'border' : ''}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {group.children.length > 1 && (
            <div className="flex rounded-md border">
              <Button
                variant={group.conjunction === 'and' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => updateNode(group.id, { conjunction: 'and' })}
                className="h-6 rounded-r-none text-xs"
              >
                AND
              </Button>
              <Button
                variant={group.conjunction === 'or' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => updateNode(group.id, { conjunction: 'or' })}
                className="h-6 rounded-l-none text-xs"
              >
                OR
              </Button>
            </div>
          )}
        </div>
        {!isRoot && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => removeNode(group.id)}
            className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        )}
      </div>

      {group.children.map((child) => (
        <FilterNodeComponent key={child.id} node={child} />
      ))}

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => addCondition(group.id)}
          className="text-xs"
        >
          <Plus className="mr-1 h-3 w-3" />
          Add condition
        </Button>
        <Button variant="outline" size="sm" onClick={() => addGroup(group.id)} className="text-xs">
          <Plus className="mr-1 h-3 w-3" />
          Add group
        </Button>
      </div>
    </div>
  );
}
