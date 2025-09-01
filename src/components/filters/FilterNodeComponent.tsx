import React from 'react';
import { FilterNode } from '@/types/filters';
import { FilterGroupComponent } from './FilterGroupComponent';
import { FilterConditionComponent } from './FilterConditionComponent';

interface FilterNodeComponentProps {
  node: FilterNode;
}

export function FilterNodeComponent({ node }: FilterNodeComponentProps) {
  if ('children' in node) {
    return <FilterGroupComponent group={node} />;
  }
  return <FilterConditionComponent condition={node} />;
}
