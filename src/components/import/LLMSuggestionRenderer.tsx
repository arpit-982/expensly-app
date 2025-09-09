import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';
import type { ICellRendererParams } from 'ag-grid-community';

interface LLMSuggestionRendererParams extends ICellRendererParams {
  onApplySuggestion?: (params: any) => void;
}

/**
 * LLMSuggestionRenderer
 *
 * Lightweight React cell renderer for AG Grid that displays LLM suggestions
 * with confidence scores and an apply button.
 *
 * Features:
 * - Shows suggested account with confidence percentage
 * - Apply button to accept the suggestion
 * - Visual indicators for confidence levels
 */
export default function LLMSuggestionRenderer(props: LLMSuggestionRendererParams) {
  const suggestion = props.value;
  const confidence = props.data?.confidence;
  const suggestedTags = props.data?.suggested_tags || [];
  const hasApplied = props.data?.account === suggestion;

  if (!suggestion) {
    return (
      <div className="flex items-center px-2 py-1 h-full text-muted-foreground text-sm">
        —
      </div>
    );
  }

  const confidencePercent = confidence ? Math.round(confidence * 100) : 0;
  const confidenceColor = 
    confidencePercent >= 80 ? 'bg-green-100 text-green-800' :
    confidencePercent >= 60 ? 'bg-yellow-100 text-yellow-800' :
    'bg-red-100 text-red-800';

  const handleApply = () => {
    try {
      const applyFn = (props as any).onApplySuggestion;
      if (typeof applyFn === 'function') {
        applyFn(props);
      }
    } catch (e) {
      console.error('LLMSuggestionRenderer apply error', e);
    }
  };

  return (
    <div className="flex items-center gap-2 px-2 py-1 h-full">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1 mb-1">
          <Sparkles className="h-3 w-3 text-purple-500" />
          <span className="text-sm font-medium truncate" title={suggestion}>
            {suggestion}
          </span>
          {confidence && (
            <Badge 
              variant="outline" 
              className={`text-xs px-1.5 py-0.5 ${confidenceColor}`}
            >
              {confidencePercent}%
            </Badge>
          )}
        </div>
        {suggestedTags.length > 0 && (
          <div className="flex gap-1 flex-wrap">
            {suggestedTags.slice(0, 2).map((tag: string, index: number) => (
              <Badge key={index} variant="secondary" className="text-xs px-1.5 py-0.5">
                {tag}
              </Badge>
            ))}
            {suggestedTags.length > 2 && (
              <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                +{suggestedTags.length - 2}
              </Badge>
            )}
          </div>
        )}
      </div>
      {!hasApplied && (
        <Button
          size="sm"
          variant="outline"
          onClick={handleApply}
          className="h-6 px-2 text-xs"
        >
          Apply
        </Button>
      )}
      {hasApplied && (
        <Badge variant="default" className="text-xs px-2 py-0.5">
          Applied
        </Badge>
      )}
    </div>
  );
}
