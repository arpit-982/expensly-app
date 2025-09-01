import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { DatePicker } from './DatePicker';
import { useFilter } from '@/contexts/FilterContext';
import { FilterCondition, FilterField, validOperators } from '@/types/filters';
import { Button } from '../ui/button';
import { Trash2 } from 'lucide-react';

interface FilterConditionComponentProps {
  condition: FilterCondition;
}

export function FilterConditionComponent({ condition }: FilterConditionComponentProps) {
  const { updateNode, changeConditionField, removeNode } = useFilter();

  const handleFieldChange = (field: FilterField) => {
    changeConditionField(condition.id, field);
  };

  const handleOperatorChange = (operator: any) => {
    updateNode(condition.id, { operator });
  };

  const handleValueChange = (value: any) => {
    updateNode(condition.id, { value });
  };

  const renderValueInput = () => {
    switch (condition.field) {
      case 'date':
        return (
          <DatePicker
            value={condition.value}
            onChange={handleValueChange}
            placeholder="Select date"
          />
        );
      case 'amount':
        return (
          <Input
            type="number"
            value={condition.value || ''}
            onChange={(e) => handleValueChange(e.target.value)}
            placeholder="Enter amount"
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

  return (
    <div className="flex w-full items-center gap-2">
      <Select value={condition.field} onValueChange={handleFieldChange}>
        <SelectTrigger className="w-32">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {Object.keys(validOperators).map((field) => (
            <SelectItem key={field} value={field}>
              {field}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={condition.operator} onValueChange={handleOperatorChange}>
        <SelectTrigger className="w-32">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {validOperators[condition.field].map((operator) => (
            <SelectItem key={operator} value={operator}>
              {operator.replace(/_/g, ' ')}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="flex-1">{renderValueInput()}</div>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => removeNode(condition.id)}
        className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
      >
        <Trash2 className="h-3 w-3" />
      </Button>
    </div>
  );
}
