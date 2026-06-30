import { ComponentPropsWithoutRef, forwardRef } from 'react';




import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipTrigger } from './shadcn/tooltip';
import { Button } from './shadcn/button';

export type TooltipIconButtonProps = ComponentPropsWithoutRef<typeof Button> & {
    tooltip: string;
    side?: 'top' | 'bottom' | 'left' | 'right';
};

export const TooltipIconButton = forwardRef<
    HTMLButtonElement,
    TooltipIconButtonProps
>(({ children, tooltip, side = 'bottom', className, ...rest }, ref) => {
    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <Button
                    variant="ghost"
                    size="icon"
                    {...rest}
                    className={cn('size-6', className)}
                    ref={ref}
                >
                    {children}
                    <span className="sr-only">{tooltip}</span>
                </Button>
            </TooltipTrigger>
            <TooltipContent side={side}>{tooltip}</TooltipContent>
        </Tooltip>
    );
});

TooltipIconButton.displayName = 'TooltipIconButton';
