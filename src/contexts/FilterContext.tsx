import React, { createContext, useContext, useState, ReactNode } from 'react';
import { 
  FilterConfig, 
  FilterGroup, 
  FilterCondition, 
  createFilterGroup, 
  createFilterCondition, 
  createEmptyFilterConfig 
} from '@/lib/filterEngine';

interface FilterContextType {
  filterConfig: FilterConfig;
  setFilterConfig: (config: FilterConfig) => void;
  addFilterGroup: () => void;
  removeFilterGroup: (groupId: string) => void;
  addCondition: (groupId: string, field?: FilterCondition['field']) => void;
  removeCondition: (groupId: string, conditionIndex: number) => void;
  updateCondition: (groupId: string, conditionIndex: number, condition: Partial<FilterCondition>) => void;
  updateGroupLogic: (groupId: string, logic: 'AND' | 'OR') => void;
  updateGroupLogic: (groupId: string, logic: 'AND' | 'OR') => void;
  updateFilterGroupLogic: (logic: 'AND' | 'OR') => void;
  clearAllFilters: () => void;
  hasActiveFilters: boolean;
}

const FilterContext = createContext<FilterContextType | undefined>(undefined);

export function FilterProvider({ children }: { children: ReactNode }) {
  const [filterConfig, setFilterConfig] = useState<FilterConfig>(createEmptyFilterConfig());

  const addFilterGroup = () => {
    setFilterConfig(prev => ({
      ...prev,
      groups: [...prev.groups, createFilterGroup()],
    }));
  };

  const removeFilterGroup = (groupId: string) => {
    setFilterConfig(prev => ({
      ...prev,
      groups: prev.groups.filter(group => group.id !== groupId),
    }));
  };

  const addCondition = (groupId: string, field?: FilterCondition['field']) => {
    setFilterConfig(prev => ({
      ...prev,
      groups: prev.groups.map(group => {
        if (group.id === groupId) {
          const newCondition = field 
            ? createFilterCondition(field)
            : createFilterCondition('date');
          return {
            ...group,
            conditions: [...group.conditions, newCondition],
          };
        }
        return group;
      }),
    }));
  };

  const removeCondition = (groupId: string, conditionIndex: number) => {
    setFilterConfig(prev => ({
      ...prev,
      groups: prev.groups.map(group => {
        if (group.id === groupId) {
          return {
            ...group,
            conditions: group.conditions.filter((_, index) => index !== conditionIndex),
          };
        }
        return group;
      }),
    }));
  };

  const updateCondition = (groupId: string, conditionIndex: number, updates: Partial<FilterCondition>) => {
    setFilterConfig(prev => ({
      ...prev,
      groups: prev.groups.map(group => {
        if (group.id === groupId) {
          return {
            ...group,
            conditions: group.conditions.map((condition, index) => {
              if (index === conditionIndex) {
                return { ...condition, ...updates };
              }
              return condition;
            }),
          };
        }
        return group;
      }),
    }));
  };

  const updateGroupLogic = (groupId: string, logic: 'AND' | 'OR') => {
    setFilterConfig(prev => ({
      ...prev,
      groups: prev.groups.map(group => {
        if (group.id === groupId) {
          return { ...group, logic };
        }
        return group;
      }),
    }));
  };

  const updateFilterGroupLogic = (logic: 'AND' | 'OR') => {
    setFilterConfig(prev => ({
      ...prev,
      groupLogic: logic,
    }));
  };

  const clearAllFilters = () => {
    setFilterConfig(createEmptyFilterConfig());
  };

  const hasActiveFilters = filterConfig.groups.some(group => group.conditions.length > 0);

  return (
    <FilterContext.Provider value={{
      filterConfig,
      setFilterConfig,
      addFilterGroup,
      removeFilterGroup,
      addCondition,
      removeCondition,
      updateCondition,
      updateGroupLogic,
      updateFilterGroupLogic,
      clearAllFilters,
      hasActiveFilters,
    }}>
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