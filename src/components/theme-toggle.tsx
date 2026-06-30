import * as React from 'react';
import { Moon, Sun, Monitor } from 'lucide-react';
import { useTheme } from './contexts/ThemeContext';

import { Button } from './ui/shadcn/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/shadcn/dropdown-menu';

export function ThemeToggle() {
  const { themeMode, setThemeMode, actualTheme } = useTheme();

  const getIcon = () => {
    if (themeMode === 'system') {
      return <Monitor className="h-[1.2rem] w-[1.2rem]" />;
    }
    return (
      <>
        <Sun
          className={`h-[1.2rem] w-[1.2rem] transition-all ${
            actualTheme === 'dark' ? 'rotate-90 scale-0' : 'rotate-0 scale-100'
          }`}
        />
        <Moon
          className={`absolute h-[1.2rem] w-[1.2rem] transition-all ${
            actualTheme === 'dark' ? 'rotate-0 scale-100' : 'rotate-90 scale-0'
          }`}
        />
      </>
    );
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          {getIcon()}
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() => setThemeMode('light')}
          className="hover:cursor-pointer"
        >
          <Sun className="mr-2 h-4 w-4" />
          Light
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setThemeMode('dark')}
          className="hover:cursor-pointer"
        >
          <Moon className="mr-2 h-4 w-4" />
          Dark
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setThemeMode('system')}
          className="hover:cursor-pointer"
        >
          <Monitor className="mr-2 h-4 w-4" />
          System
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
