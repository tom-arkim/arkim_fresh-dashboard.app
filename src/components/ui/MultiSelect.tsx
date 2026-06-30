import { X, Check } from 'lucide-react';
import { Badge } from '@/components/ui/shadcn/badge';
import {
  Command,
  CommandGroup,
  CommandItem,
  CommandList,
  CommandInput,
  CommandEmpty,
} from '@/components/ui/shadcn/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/shadcn/popover';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/shadcn/button';
import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/shadcn/tooltip';

export type Option = {
  label: React.ReactNode;
  value: string;
  badgeLabel?: string;
  badgeTooltip?: string;
};

interface MultiSelectProps {
  options: Option[];
  selected: string[];
  onChange: (selected: string[]) => void;
  className?: string;
  placeholder?: string;
  loading?: boolean;
  disabled?: boolean;
}

const MAX_VISIBLE = 3;

export function MultiSelect({
  options,
  selected,
  onChange,
  className,
  placeholder = 'Select items...',
  loading = false,
  disabled = false,
  ...props
}: MultiSelectProps) {
  const [open, setOpen] = useState(false);
  const { t } = useTranslation();

  const [_inputValue, setInputValue] = useState('');
  const [isSelectedAll, setIsSelectedAll] = useState(false);

  const handleUnselect = (item: string) => {
    if (disabled) return;
    onChange(selected.filter((i) => i !== item));
  };

  useEffect(() => {
    if (selected.length > 0 && selected.length === options.length) {
      setIsSelectedAll(true);
    } else {
      setIsSelectedAll(false);
    }
  }, [selected, options]);

  const visibleSelected = selected.slice(0, MAX_VISIBLE);
  const overflowCount = selected.length - MAX_VISIBLE;

  const renderBadge = (item: string) => {
    const option = options.find((o) => o.value === item);
    const label = option
      ? option.badgeLabel || (typeof option.label === 'string' ? option.label : item)
      : item;

    const badgeContent = (
      <Badge
        variant="secondary"
        key={item}
        className="font-normal px-2 py-0.5 text-xs flex items-center gap-1"
      >
        <span className="max-w-[150px] truncate">{label}</span>
        <div
          role="button"
          tabIndex={0}
          className="rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 cursor-pointer hover:bg-muted p-0.5"
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleUnselect(item);
            }
          }}
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            handleUnselect(item);
          }}
        >
          <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
        </div>
      </Badge>
    );

    if (!option?.badgeTooltip) return badgeContent;

    return (
      <Tooltip key={item}>
        <TooltipTrigger>{badgeContent}</TooltipTrigger>
        <TooltipContent>{option?.badgeTooltip}</TooltipContent>
      </Tooltip>
    );
  };

  return (
    <Popover open={open} onOpenChange={setOpen} {...props}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            'w-full justify-between items-center h-auto min-h-9 px-3 py-1 hover:bg-background',
            className
          )}
        >
          <div className="flex flex-wrap gap-1 items-center flex-1">
            {selected.length === 0 && (
              <span className="text-muted-foreground font-normal">
                {placeholder}
              </span>
            )}

            {/* show first MAX_VISIBLE badges */}
            {visibleSelected.map((item) => renderBadge(item))}

            {/* overflow badge — clicking opens the dropdown */}
            {overflowCount > 0 && (
              <Badge
                variant="secondary"
                className="font-normal px-2 py-0.5 text-xs cursor-pointer hover:bg-muted"
                onMouseDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setOpen(true);
                }}
              >
                +{overflowCount} more
              </Badge>
            )}
          </div>

          {/* clear all — only icon remaining, no chevron */}
          {selected.length > 0 && (
            <div
              role="button"
              className="hover:bg-muted rounded-md cursor-pointer ml-2 flex-shrink-0"
              onClick={(e) => {
                e.stopPropagation();
                onChange([]);
              }}
            >
              <X className="h-4 w-4 opacity-50 hover:opacity-100" />
            </div>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        className="w-[--radix-popover-trigger-width] p-0"
        align="start"
      >
        <Command className="w-full">
          <CommandInput
            placeholder={placeholder}
            onValueChange={setInputValue}
          />
          <CommandList
            className="max-h-64 w-full overflow-y-auto"
            onWheel={(e) => e.stopPropagation()}
          >
            <CommandEmpty>
              {loading ? t('common.loading') : t('common.noItemFound')}
            </CommandEmpty>
            <CommandGroup>
              {options.length > 0 ? (
                <CommandItem
                  className="cursor-pointer"
                  onSelect={() => {
                    const allValues = options.map((option) => option.value);
                    if (isSelectedAll) {
                      onChange([]);
                    } else {
                      onChange(allValues);
                    }
                  }}
                >
                  <div
                    className={cn(
                      'mr-2 flex h-4 w-4 items-center justify-center rounded-md border border-primary',
                      isSelectedAll
                        ? 'bg-primary text-primary-foreground'
                        : 'opacity-50 [&_svg]:invisible'
                    )}
                  >
                    <Check className={cn('h-4 w-4')} />
                  </div>
                  <span className="font-medium text-primary">
                    {t('common.selecteAll')}
                  </span>
                </CommandItem>
              ) : null}
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  value={option.value}
                  className="cursor-pointer"
                  onSelect={() => {
                    const isSelected = selected.includes(option.value);
                    onChange(
                      isSelected
                        ? selected.filter((item) => item !== option.value)
                        : [...selected, option.value]
                    );
                  }}
                >
                  <div
                    className={cn(
                      'mr-2 flex h-4 w-4 items-center justify-center rounded-md border border-primary',
                      selected.includes(option.value)
                        ? 'bg-primary text-primary-foreground'
                        : 'opacity-50 [&_svg]:invisible'
                    )}
                  >
                    <Check className={cn('h-4 w-4')} />
                  </div>
                  <div className="flex-1">{option.label}</div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}