import React from 'react';
import { Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useFilter } from '@/contexts/FilterContext';
import { FilterCondition } from './FilterCondition';
import { FilterGroup as FilterGroupType } from '@/lib/filterEngine';

interface FilterGroupProps {
  group: FilterGroupType;
  groupIndex: number;
}

export function FilterGroup({ group, groupIndex }: FilterGroupProps) {
  const { addCondition, removeCondition, updateGroupLogic } = useFilter();

  const handleAddCondition = () => {
    addCondition(group.id);
  };

  const handleRemoveCondition = (conditionIndex: number) => {
    removeCondition(group.id, conditionIndex);
  };

  const handleUpdateCondition = (conditionIndex: number, updates: Partial<any>) => {
    // This will be handled by the FilterCondition component
  };

  return (
    <div className="space-y-3">
      {group.conditions.length === 0 ? (
        <div className="text-center py-4 text-muted-foreground">
          <p className="text-sm">No conditions in this group</p>
          <Button
            variant="outline"
            size="sm"
            onClick={handleAddCondition}
            className="mt-2 text-xs"
          >
            <Plus className="h-3 w-3 mr-1" />
            Add condition
          </Button>
        </div>
      ) : (
        <>
          {group.conditions.map((condition, conditionIndex) => (
            <div key={conditionIndex} className="flex items-start gap-2">
              <div className="flex-1">
                <FilterCondition
                  condition={condition}
                  groupId={group.id}
                  conditionIndex={conditionIndex}
                />
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleRemoveCondition(conditionIndex)}
                className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
          
          <Button
            variant="outline"
            size="sm"
            onClick={handleAddCondition}
            className="text-xs"
          >
            <Plus className="h-3 w-3 mr-1" />
            Add condition
          </Button>
        </>
      )}
    </div>
  );
} 