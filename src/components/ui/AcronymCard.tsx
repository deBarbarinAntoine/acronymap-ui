"use client";

import { useState } from 'react';
import { Card, Button } from '@heroui/react';
import { ChevronDown, ChevronUp, Hash, Languages, Tag } from 'lucide-react';

type AcronymCardProps = {
  masterId: string;
  search: string;
  data: Record<string, string>;
  highlight?: string;
};

function parseFieldKey(key: string): { language: string; category: string; type: string } {
  const parts = key.split(':');
  return {
    language: parts[0] || 'unknown',
    category: parts[1] || 'general',
    type: parts[2] || 'value',
  };
}

function getDisplayLabel(key: string): string {
  const { type } = parseFieldKey(key);
  const labels: Record<string, string> = {
    label: 'Label',
    def: 'Definition',
    desc: 'Description',
    example: 'Example',
    url: 'URL',
  };
  return labels[type] || type;
}

function getIconForType(type: string) {
  switch (type) {
    case 'label':
      return <Hash className="h-3.5 w-3.5" />;
    case 'def':
    case 'desc':
      return <Languages className="h-3.5 w-3.5" />;
    default:
      return <Tag className="h-3.5 w-3.5" />;
  }
}

export function AcronymCard({ masterId, search, data, highlight }: AcronymCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const entries = Object.entries(data);
  const primaryEntries = entries.slice(0, 2);
  const secondaryEntries = entries.slice(2);

  const highlightText = (text: string): React.ReactNode => {
    if (!highlight) return text;
    const regex = new RegExp(`(${highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);
    return parts.map((part, i) =>
      regex.test(part) ? (
        <mark key={i} className="bg-primary/20 text-primary rounded px-0.5">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  return (
    <Card className="group overflow-hidden transition-all duration-200 hover:shadow-md">
      <div
        className="flex cursor-pointer items-start gap-3 p-4"
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setIsExpanded(!isExpanded); }}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex flex-1 flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="text-lg font-semibold tracking-tight">
              {highlightText(masterId)}
            </span>
            {search !== masterId && (
              <span className="text-xs text-muted">
                matched via &ldquo;{highlightText(search)}&rdquo;
              </span>
            )}
          </div>
          {primaryEntries.map(([key, value]) => (
            <div key={key} className="flex items-start gap-2 text-sm">
              <span className="mt-0.5 text-muted/60 shrink-0">
                {getIconForType(parseFieldKey(key).type)}
              </span>
              <div className="flex flex-col">
                <span className="text-xs text-muted">{getDisplayLabel(key)}</span>
                <span className="text-default-700 dark:text-default-300">
                  {highlightText(value)}
                </span>
              </div>
            </div>
          ))}
        </div>

        <Button
          isIconOnly
          variant="ghost"
          size="sm"
          className="shrink-0"
          onPress={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? (
            <ChevronUp className="h-4 w-4" />
          ) : (
            <ChevronDown className="h-4 w-4" />
          )}
        </Button>
      </div>

      {isExpanded && secondaryEntries.length > 0 && (
        <Card.Content className="border-t border-border/40 pt-4">
          <div className="flex flex-col gap-3">
            {secondaryEntries.map(([key, value]) => (
              <div key={key} className="flex items-start gap-2 text-sm">
                <span className="mt-0.5 text-muted/60 shrink-0">
                  {getIconForType(parseFieldKey(key).type)}
                </span>
                <div className="flex flex-col">
                  <span className="text-xs text-muted">{getDisplayLabel(key)}</span>
                  <span className="text-default-700 dark:text-default-300">
                    {highlightText(value)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card.Content>
      )}
    </Card>
  );
}
