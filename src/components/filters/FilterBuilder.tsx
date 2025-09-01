import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useFilter } from '@/contexts/FilterContext';
import { FilterNodeComponent } from './FilterNodeComponent';
import { PlusCircle } from 'lucide-react';

export function FilterBuilder() {
  const { filter, addCondition, addGroup, clearAll, hasActiveFilters } = useFilter();

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Filters</CardTitle>
          {hasActiveFilters && (
            <Button variant="outline" size="sm" onClick={clearAll} className="text-xs">
              Clear all
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {hasActiveFilters ? (
          <FilterNodeComponent node={filter} />
        ) : (
          <div className="py-8 text-center text-muted-foreground">
            <p>No filters applied</p>
            <p className="text-sm">Click "Add condition" or "Add group" to get started</p>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex items-center justify-end gap-2 pt-4">
        <Button variant="outline" size="sm" onClick={() => addCondition(filter.id)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add condition
        </Button>
        <Button variant="outline" size="sm" onClick={() => addGroup(filter.id)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add group
        </Button>
      </CardFooter>
    </Card>
  );
}
