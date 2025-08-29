"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

const Select = React.forwardRef<
  HTMLSelectElement,
  React.ComponentPropsWithoutRef<"select"> & {
    onValueChange?: (value: string) => void;
  }
>(({ className, children, onValueChange, ...props }, ref) => {
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (onValueChange) {
      onValueChange(e.target.value);
    }
    if (props.onChange) {
      props.onChange(e);
    }
  };

  return (
    <select
      className={cn(
        "flex h-10 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      ref={ref}
      onChange={handleChange}
      {...props}
    >
      {children}
    </select>
  );
});
Select.displayName = "Select";

const SelectContent = React.forwardRef<
  HTMLDivElement,
  React.ComponentPropsWithoutRef<"div">
>(({ className, children, ...props }, ref) => {
  return (
    <div ref={ref} {...props}>
      {children}
    </div>
  );
});
SelectContent.displayName = "SelectContent";

const SelectItem = React.forwardRef<
  HTMLOptionElement,
  React.ComponentPropsWithoutRef<"option">
>(({ className, children, ...props }, ref) => {
  return (
    <option
      className={cn("py-1.5 pl-3 pr-9 text-sm", className)}
      ref={ref}
      {...props}
    >
      {children}
    </option>
  );
});
SelectItem.displayName = "SelectItem";

const SelectTrigger = React.forwardRef<
  HTMLSelectElement,
  React.ComponentPropsWithoutRef<"select">
>(({ className, children, ...props }, ref) => {
  return (
    <select
      className={cn(
        "flex h-10 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      ref={ref}
      {...props}
    >
      {children}
    </select>
  );
});
SelectTrigger.displayName = "SelectTrigger";

const SelectValue = React.forwardRef<
  HTMLSpanElement,
  React.ComponentPropsWithoutRef<"span"> & {
    placeholder?: string;
  }
>(({ className, placeholder, ...props }, ref) => {
  return (
    <option value="" disabled>
      {placeholder}
    </option>
  );
});
SelectValue.displayName = "SelectValue";

export {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
};