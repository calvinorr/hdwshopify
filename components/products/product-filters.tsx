"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { SlidersHorizontal, X } from "lucide-react";
import type { ProductFilters, FilterOptions, YarnWeight } from "@/types/product";

interface ProductFiltersProps {
  filters: ProductFilters;
  onFilterChange: (filters: ProductFilters) => void;
  options: FilterOptions;
  className?: string;
}

const AVAILABILITY_OPTIONS = [
  { value: "in-stock" as const, label: "In Stock" },
  { value: "low-stock" as const, label: "Low Stock" },
  { value: "sold-out" as const, label: "Sold Out" },
];

function FilterSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-3">
      <h4 className="font-heading text-sm font-medium text-foreground">{title}</h4>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function FilterCheckbox({
  id,
  label,
  checked,
  onCheckedChange,
}: {
  id: string;
  label: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center space-x-2">
      <Checkbox
        id={id}
        checked={checked}
        onCheckedChange={(checked) => onCheckedChange(checked === true)}
      />
      <Label
        htmlFor={id}
        className="font-body text-sm text-muted-foreground cursor-pointer hover:text-foreground transition-colors"
      >
        {label}
      </Label>
    </div>
  );
}

function FilterContent({
  filters,
  onFilterChange,
  options,
}: Omit<ProductFiltersProps, "className">) {
  const handleWeightChange = (weight: YarnWeight, checked: boolean) => {
    const newWeights = checked
      ? [...filters.weight, weight]
      : filters.weight.filter((w) => w !== weight);
    onFilterChange({ ...filters, weight: newWeights });
  };

  const handleFiberChange = (fiber: string, checked: boolean) => {
    const newFibers = checked
      ? [...filters.fiberContent, fiber]
      : filters.fiberContent.filter((f) => f !== fiber);
    onFilterChange({ ...filters, fiberContent: newFibers });
  };

  const handleAvailabilityChange = (
    availability: ProductFilters["availability"][number],
    checked: boolean
  ) => {
    const newAvailability = checked
      ? [...filters.availability, availability]
      : filters.availability.filter((a) => a !== availability);
    onFilterChange({ ...filters, availability: newAvailability });
  };

  const clearAllFilters = () => {
    onFilterChange({
      weight: [],
      fiberContent: [],
      availability: [],
    });
  };

  const hasActiveFilters =
    filters.weight.length > 0 ||
    filters.fiberContent.length > 0 ||
    filters.availability.length > 0;

  return (
    <div className="space-y-6">
      {/* Clear Filters */}
      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={clearAllFilters}
          className="font-body text-sm text-muted-foreground hover:text-foreground w-full justify-start p-0 h-auto"
        >
          <X className="w-4 h-4 mr-1" />
          Clear all filters
        </Button>
      )}

      {/* Yarn Weight */}
      {options.weights.length > 0 && (
        <FilterSection title="Yarn Weight">
          {options.weights.map((weight) => (
            <FilterCheckbox
              key={weight}
              id={`weight-${weight}`}
              label={weight}
              checked={filters.weight.includes(weight)}
              onCheckedChange={(checked) => handleWeightChange(weight, checked)}
            />
          ))}
        </FilterSection>
      )}

      {/* Fiber Content */}
      {options.fiberContents.length > 0 && (
        <FilterSection title="Fiber Content">
          {options.fiberContents.map((fiber) => (
            <FilterCheckbox
              key={fiber}
              id={`fiber-${fiber}`}
              label={fiber}
              checked={filters.fiberContent.includes(fiber)}
              onCheckedChange={(checked) => handleFiberChange(fiber, checked)}
            />
          ))}
        </FilterSection>
      )}

      {/* Availability */}
      <FilterSection title="Availability">
        {AVAILABILITY_OPTIONS.map((option) => (
          <FilterCheckbox
            key={option.value}
            id={`availability-${option.value}`}
            label={option.label}
            checked={filters.availability.includes(option.value)}
            onCheckedChange={(checked) =>
              handleAvailabilityChange(option.value, checked)
            }
          />
        ))}
      </FilterSection>
    </div>
  );
}

// Desktop Sidebar
function DesktopFilters({
  filters,
  onFilterChange,
  options,
  className,
}: ProductFiltersProps) {
  return (
    <aside
      className={cn(
        "hidden lg:block w-64 shrink-0 pr-8 border-r border-border/50",
        className
      )}
    >
      <div className="sticky top-24">
        <h3 className="font-heading text-lg font-medium text-foreground mb-6">
          Filters
        </h3>
        <FilterContent
          filters={filters}
          onFilterChange={onFilterChange}
          options={options}
        />
      </div>
    </aside>
  );
}

// Mobile Sheet
function MobileFilters({
  filters,
  onFilterChange,
  options,
}: Omit<ProductFiltersProps, "className">) {
  const [open, setOpen] = React.useState(false);

  const activeCount =
    filters.weight.length +
    filters.fiberContent.length +
    filters.availability.length;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="lg:hidden font-body gap-2"
        >
          <SlidersHorizontal className="w-4 h-4" />
          Filters
          {activeCount > 0 && (
            <span className="ml-1 bg-primary text-primary-foreground rounded-full w-5 h-5 text-xs flex items-center justify-center">
              {activeCount}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[300px] sm:w-[350px]">
        <SheetHeader>
          <SheetTitle className="font-heading text-lg">Filters</SheetTitle>
        </SheetHeader>
        <div className="mt-6 pr-4 overflow-y-auto max-h-[calc(100vh-8rem)]">
          <FilterContent
            filters={filters}
            onFilterChange={onFilterChange}
            options={options}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}

export function ProductFilters({
  filters,
  onFilterChange,
  options,
  className,
}: ProductFiltersProps) {
  return (
    <>
      <DesktopFilters
        filters={filters}
        onFilterChange={onFilterChange}
        options={options}
        className={className}
      />
      <MobileFilters
        filters={filters}
        onFilterChange={onFilterChange}
        options={options}
      />
    </>
  );
}

// Export mobile trigger separately for flexible layouts
export { MobileFilters as ProductFiltersMobile };
