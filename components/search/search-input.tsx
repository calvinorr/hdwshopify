"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";

interface SearchInputProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  className?: string;
  expandable?: boolean;
  defaultValue?: string;
  debounceMs?: number;
}

export function SearchInput({
  onSearch,
  placeholder = "Search yarns, dyes, fibers...",
  className,
  expandable = false,
  defaultValue = "",
  debounceMs = 300,
}: SearchInputProps) {
  const [value, setValue] = useState(defaultValue);
  const [isExpanded, setIsExpanded] = useState(!expandable || !!defaultValue);
  const inputRef = useRef<HTMLInputElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout>(undefined);

  // Debounced search
  const debouncedSearch = useCallback(
    (query: string) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        onSearch(query);
      }, debounceMs);
    },
    [onSearch, debounceMs]
  );

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Focus input when expanded
  useEffect(() => {
    if (isExpanded && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isExpanded]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setValue(newValue);
    debouncedSearch(newValue);
  };

  const handleClear = () => {
    setValue("");
    onSearch("");
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleExpand = () => {
    setIsExpanded(true);
  };

  const handleCollapse = () => {
    if (expandable && !value) {
      setIsExpanded(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Immediate search on submit
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    onSearch(value);
  };

  // Expandable: icon-only button on mobile
  if (expandable && !isExpanded) {
    return (
      <Button
        variant="ghost"
        size="icon"
        onClick={handleExpand}
        className={cn("shrink-0", className)}
        aria-label="Open search"
      >
        <Search className="h-5 w-5" />
      </Button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        "relative flex items-center",
        expandable && "animate-in fade-in slide-in-from-right-2 duration-200",
        className
      )}
    >
      <div className="relative w-full">
        {/* Search icon */}
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

        {/* Input field */}
        <Input
          ref={inputRef}
          type="search"
          value={value}
          onChange={handleChange}
          onBlur={handleCollapse}
          placeholder={placeholder}
          className={cn(
            "h-10 w-full rounded-full border-border bg-card pl-10 pr-10 text-sm",
            "placeholder:text-muted-foreground/70",
            "focus-visible:ring-primary/30",
            "transition-all duration-200"
          )}
          aria-label="Search"
        />

        {/* Clear button */}
        {value && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-0.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            aria-label="Clear search"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Collapse button for expandable mode on mobile */}
      {expandable && (
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => {
            handleClear();
            setIsExpanded(false);
          }}
          className="ml-1 shrink-0 md:hidden"
          aria-label="Close search"
        >
          <X className="h-5 w-5" />
        </Button>
      )}
    </form>
  );
}
