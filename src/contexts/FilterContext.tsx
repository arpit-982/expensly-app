import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { FilterGroup, FilterCondition, FilterNode, FilterField } from '@/types/filters';
import { createFilterGroup, createFilterCondition } from '@/lib/filterEngine';

// --- Recursive Helper Functions for Immutable Updates ---

/**
 * Recursively finds a node by its ID and applies an update function to it.
 * Returns a new, updated tree.
 */
function updateNodeRecursive(
  currentNode: FilterNode,
  nodeId: string,
  updateFn: (node: FilterNode) => FilterNode,
): FilterNode {
  if (currentNode.id === nodeId) {
    return updateFn(currentNode);
  }

  if ('children' in currentNode) {
    return {
      ...currentNode,
      children: currentNode.children.map((child) => updateNodeRecursive(child, nodeId, updateFn)),
    };
  }

  return currentNode;
}

/**
 * Recursively finds and removes a node by its ID.
 * Returns a new, updated tree, or null if the node itself was removed.
 */
function removeNodeRecursive(currentNode: FilterNode, nodeIdToRemove: string): FilterNode | null {
  if (currentNode.id === nodeIdToRemove) {
    return null; // This node will be filtered out by the caller.
  }

  if ('children' in currentNode) {
    return {
      ...currentNode,
      children: currentNode.children
        .map((child) => removeNodeRecursive(child, nodeIdToRemove))
        .filter((child): child is FilterNode => child !== null),
    };
  }

  return currentNode;
}

/**
 * Recursively checks if a filter tree contains any conditions.
 */
function hasConditionsRecursive(node: FilterNode): boolean {
  if ('field' in node) {
    return true; // It's a condition
  }
  if ('children' in node) {
    return node.children.some(hasConditionsRecursive); // Check children
  }

  return false;
}

// --- React Context Definition ---

interface FilterContextType {
  filter: FilterGroup;
  setFilter: (filter: FilterGroup) => void;
  addCondition: (groupId: string, field?: FilterField) => void;
  addGroup: (groupId: string) => void;
  removeNode: (nodeId: string) => void;
  updateNode: (nodeId: string, updates: Partial<FilterNode>) => void;
  changeConditionField: (conditionId: string, newField: FilterField) => void;
  clearAll: () => void;
  hasActiveFilters: boolean;
}

const FilterContext = createContext<FilterContextType | undefined>(undefined);

export function FilterProvider({ children }: { children: ReactNode }) {
  const [filter, setFilter] = useState<FilterGroup>(createFilterGroup());

  const addCondition = useCallback((groupId: string, field: FilterField = 'date') => {
    const newCondition = createFilterCondition(field);
    const updater = (node: FilterNode) => {
      if ('children' in node) {
        return { ...node, children: [...node.children, newCondition] };
      }
      return node;
    };
    setFilter(
      (currentFilter) => updateNodeRecursive(currentFilter, groupId, updater) as FilterGroup,
    );
  }, []);

  const addGroup = useCallback((groupId: string) => {
    const newGroup = createFilterGroup();
    const updater = (node: FilterNode) => {
      if ('children' in node) {
        return { ...node, children: [...node.children, newGroup] };
      }
      return node;
    };
    setFilter(
      (currentFilter) => updateNodeRecursive(currentFilter, groupId, updater) as FilterGroup,
    );
  }, []);

  const removeNode = useCallback((nodeId: string) => {
    setFilter((currentFilter) => {
      // Prevent removing the root node
      if (currentFilter.id === nodeId) return currentFilter;
      // The result should always be a FilterGroup as we don't remove the root
      return removeNodeRecursive(currentFilter, nodeId) as FilterGroup;
    });
  }, []);
  const updateNode = useCallback((nodeId: string, updates: Partial<FilterNode>) => {
    const updater = (node: FilterNode): FilterNode => {
      // Use a type guard to handle groups and conditions separately.
      if ('children' in node) {
        // This is a FilterGroup.
        return { ...node, ...updates };
      } else {
        // This is a FilterCondition. We assert the type because we know from our UI
        // logic that we are not changing the `field` here, only `operator` or `value`.
        return { ...node, ...updates } as FilterCondition;
      }
    };
    setFilter(
      (currentFilter) => updateNodeRecursive(currentFilter, nodeId, updater) as FilterGroup,
    );
  }, []);

  const changeConditionField = useCallback((conditionId: string, newField: FilterField) => {
    const updater = (node: FilterNode) => {
      // Type guard: Only perform the update if the node is a condition.
      if ('field' in node) {
        // Create a new default condition for the field, but preserve the original ID.
        return { ...createFilterCondition(newField), id: node.id };
      }
      // If a group's ID was passed by mistake, do nothing.
      return node;
    };
    setFilter(
      (currentFilter) => updateNodeRecursive(currentFilter, conditionId, updater) as FilterGroup,
    );
  }, []);

  const clearAll = useCallback(() => {
    setFilter(createFilterGroup());
  }, []);
  const hasActiveFilters = hasConditionsRecursive(filter);
  return (
    <FilterContext.Provider
      value={{
        filter,
        setFilter,
        addCondition,
        addGroup,
        removeNode,
        updateNode,
        changeConditionField,
        clearAll,
        hasActiveFilters,
      }}
    >
      {children}
    </FilterContext.Provider>
  );
}

export function useFilter() {
  const context = useContext(FilterContext);
  if (context === undefined) {
    throw new Error('useFilter must be used within a FilterProvider');
  }
  return context;
}
