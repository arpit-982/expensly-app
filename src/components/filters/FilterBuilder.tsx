import React from 'react';
import { Plus, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useFilter } from '@/contexts/FilterContext';
import { FilterGroup } from './FilterGroup';
import { FilterCondition } from '@/lib/filterEngine';

export function FilterBuilder() {
  const {
    filterConfig,
    addFilterGroup,
    removeFilterGroup,
    updateFilterGroupLogic,
    clearAllFilters,
    hasActiveFilters,
  } = useFilter();

  const operatorLabels: Record<FilterCondition['operator'], string> = {
    equals: 'equals',
    contains: 'contains',
    starts_with: 'starts with',
    ends_with: 'ends with',
    greater_than: 'greater than',
    less_than: 'less than',
    between: 'between',
    before: 'before',
    after: 'after',
    on: 'on',
    has: 'has',
    has_not: 'does not have',
    contains_all: 'contains all',
    contains_any: 'contains any',
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Filters</CardTitle>
          <div className="flex items-center gap-2">
            {hasActiveFilters && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearAllFilters}
                className="text-xs"
              >
                Clear all
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={addFilterGroup}
              className="text-xs"
            >
              <Plus className="h-3 w-3 mr-1" />
              Add filter
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {filterConfig.groups.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>No filters applied</p>
            <p className="text-sm">Click "Add filter" to get started</p>
          </div>
        ) : (
          <>
            {/* Group Logic Toggle */}
            {filterConfig.groups.length > 1 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Groups are combined with:</span>
                <div className="flex border rounded-md">
                  <Button
                    variant={filterConfig.groupLogic === 'AND' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => updateFilterGroupLogic('AND')}
                    className="text-xs rounded-r-none"
                  >
                    AND
                  </Button>
                  <Button
                    variant={filterConfig.groupLogic === 'OR' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => updateFilterGroupLogic('OR')}
                    className="text-xs rounded-l-none"
                  >
                    OR
                  </Button>
                </div>
              </div>
            )}

            {/* Filter Groups */}
            <div className="space-y-3">
              {filterConfig.groups.map((group, groupIndex) => (
                <div key={group.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Group {groupIndex + 1}</span>
                      {group.conditions.length > 1 && (
                        <div className="flex border rounded-md">
                          <Button
                            variant={group.logic === 'AND' ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => updateGroupLogic(group.id, 'AND')}
                            className="text-xs rounded-r-none h-6"
                          >
                            AND
                          </Button>
                          <Button
                            variant={group.logic === 'OR' ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => updateGroupLogic(group.id, 'OR')}
                            className="text-xs rounded-l-none h-6"
                          >
                            OR
                          </Button>
                        </div>
                      )}
                    </div>
                    {filterConfig.groups.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFilterGroup(group.id)}
                        className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>

                  <FilterGroup group={group} groupIndex={groupIndex} />
                </div>
              ))}
            </div>

            {/* Active Filters Summary */}
            {hasActiveFilters && (
              <div className="pt-4 border-t">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-sm font-medium">Active filters:</span>
                  <Badge variant="secondary" className="text-xs">
                    {filterConfig.groups.reduce((total, group) => total + group.conditions.length, 0)} conditions
                  </Badge>
                </div>
                <div className="flex flex-wrap gap-1">
                  {filterConfig.groups.map((group, groupIndex) =>
                    group.conditions.map((condition, conditionIndex) => (
                      <Badge
                        key={`${group.id}-${conditionIndex}`}
                        variant="outline"
                        className="text-xs"
                      >
                        {condition.field} {operatorLabels[condition.operator]} {condition.value}
                        {condition.value2 && ` and ${condition.value2}`}
                      </Badge>
                    ))
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
} 