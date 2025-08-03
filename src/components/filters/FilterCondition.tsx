import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { DatePicker } from './DatePicker';
import { useFilter } from '@/contexts/FilterContext';
import { FilterCondition as FilterConditionType, filterFields } from '@/lib/filterEngine';

interface FilterConditionProps {
  condition: FilterConditionType;
  groupId: string;
  conditionIndex: number;
}

export function FilterCondition({ condition, groupId, conditionIndex }: FilterConditionProps) {
  const { updateCondition } = useFilter();

  const handleFieldChange = (field: FilterConditionType['field']) => {
    const fieldConfig = filterFields[field];
    updateCondition(groupId, conditionIndex, {
      field,
      operator: fieldConfig.operators[0],
      value: field === 'date' ? new Date().toISOString().split('T')[0] : '',
      value2: undefined,
    });
  };

  const handleOperatorChange = (operator: FilterConditionType['operator']) => {
    updateCondition(groupId, conditionIndex, { operator });
  };

  const handleValueChange = (value: any) => {
    updateCondition(groupId, conditionIndex, { value });
  };

  const handleValue2Change = (value2: any) => {
    updateCondition(groupId, conditionIndex, { value2 });
  };

  const fieldConfig = filterFields[condition.field];
  const needsSecondValue = condition.operator === 'between';

  const renderValueInput = () => {
    switch (fieldConfig.inputType) {
      case 'date':
        return (
          <DatePicker
            value={condition.value}
            onChange={handleValueChange}
            placeholder="Select date"
          />
        );
      
      case 'number':
        return (
          <Input
            type="number"
            value={condition.value || ''}
            onChange={(e) => handleValueChange(e.target.value)}
            placeholder="Enter amount"
            className="w-full"
          />
        );
      
      case 'text':
        return (
          <Input
            type="text"
            value={condition.value || ''}
            onChange={(e) => handleValueChange(e.target.value)}
            placeholder="Enter text"
            className="w-full"
          />
        );
      
      case 'multiSelect':
        return (
          <Input
            type="text"
            value={Array.isArray(condition.value) ? condition.value.join(', ') : condition.value || ''}
            onChange={(e) => handleValueChange(e.target.value.split(',').map(s => s.trim()))}
            placeholder="Enter values (comma separated)"
            className="w-full"
          />
        );
      
      default:
        return (
          <Input
            type="text"
            value={condition.value || ''}
            onChange={(e) => handleValueChange(e.target.value)}
            placeholder="Enter value"
            className="w-full"
          />
        );
    }
  };

  const renderValue2Input = () => {
    if (!needsSecondValue) return null;

    switch (fieldConfig.inputType) {
      case 'date':
        return (
          <DatePicker
            value={condition.value2}
            onChange={handleValue2Change}
            placeholder="Select end date"
          />
        );
      
      case 'number':
        return (
          <Input
            type="number"
            value={condition.value2 || ''}
            onChange={(e) => handleValue2Change(e.target.value)}
            placeholder="Enter end amount"
            className="w-full"
          />
        );
      
      default:
        return (
          <Input
            type="text"
            value={condition.value2 || ''}
            onChange={(e) => handleValue2Change(e.target.value)}
            placeholder="Enter end value"
            className="w-full"
          />
        );
    }
  };

  return (
    <div className="flex items-center gap-2 w-full">
      {/* Field Selector */}
      <Select value={condition.field} onValueChange={handleFieldChange}>
        <SelectTrigger className="w-32">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(filterFields).map(([key, config]) => (
            <SelectItem key={key} value={key}>
              {config.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Operator Selector */}
      <Select value={condition.operator} onValueChange={handleOperatorChange}>
        <SelectTrigger className="w-32">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {fieldConfig.operators.map(operator => (
            <SelectItem key={operator} value={operator}>
              {operator.replace('_', ' ')}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Value Input */}
      <div className="flex-1">
        {renderValueInput()}
      </div>

      {/* Second Value Input (for 'between' operator) */}
      {needsSecondValue && (
        <>
          <span className="text-sm text-muted-foreground">and</span>
          <div className="flex-1">
            {renderValue2Input()}
          </div>
        </>
      )}
    </div>
  );
} 