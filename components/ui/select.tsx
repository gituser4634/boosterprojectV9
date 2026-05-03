"use client";

import * as React from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown, ChevronUp } from "lucide-react";

import { cn } from "@/lib/utils";

type NativeLikeSelectProps = Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "onChange" | "children"> & {
  children?: React.ReactNode;
  onChange?: (event: React.ChangeEvent<HTMLSelectElement>) => void;
  placeholder?: string;
};

const Select = React.forwardRef<HTMLButtonElement, NativeLikeSelectProps>(
  ({ className, children, value, defaultValue, onChange, disabled, placeholder, id, name, required, autoFocus }, ref) => {
    const options = React.Children.toArray(children)
      .filter((child): child is React.ReactElement => React.isValidElement(child))
      .filter((child) => child.type === "option")
      .map((child, index) => {
        const raw = child.props as { value?: string; disabled?: boolean; children?: React.ReactNode };
        const labelText = typeof raw.children === "string" ? raw.children.trim() : "";
        const nativeValue = raw.value !== undefined ? String(raw.value) : labelText;
        const radixValue = nativeValue === "" ? `__EMPTY_OPTION__${index}` : nativeValue;

        return {
          key: `${radixValue}-${index}`,
          value: radixValue,
          nativeValue,
          disabled: Boolean(raw.disabled),
          label: raw.children,
          isPlaceholderOption: Boolean(raw.disabled) && nativeValue === "",
        };
      });

    const placeholderText =
      placeholder ??
      options.find((option) => option.isPlaceholderOption)?.label ??
      "Select option";

    const [internalValue, setInternalValue] = React.useState<string>(String(defaultValue ?? ""));
    const controlledValue = value == null ? undefined : String(value);
    const selectedValue = controlledValue ?? internalValue;
    const selectedRadixValue =
      selectedValue === ""
        ? undefined
        : options.find((option) => option.nativeValue === selectedValue)?.value ?? selectedValue;

    const handleValueChange = (nextRadixValue: string) => {
      const nextValue =
        options.find((option) => option.value === nextRadixValue)?.nativeValue ?? nextRadixValue;

      if (controlledValue === undefined) {
        setInternalValue(nextValue);
      }

      if (onChange) {
        const syntheticEvent = {
          target: { value: nextValue },
          currentTarget: { value: nextValue },
        } as React.ChangeEvent<HTMLSelectElement>;
        onChange(syntheticEvent);
      }
    };

    return (
      <SelectPrimitive.Root value={selectedRadixValue} onValueChange={handleValueChange} disabled={disabled}>
        <SelectPrimitive.Trigger
          ref={ref}
          id={id}
          autoFocus={autoFocus}
          className={cn(
            "flex h-11 w-full items-center justify-between rounded-md border border-outline/25 bg-surface-container-high/80 px-4 py-2 text-sm text-on-surface ring-offset-background placeholder:text-on-surface-variant/75 focus:outline-none focus:ring-2 focus:ring-primary/60 disabled:cursor-not-allowed disabled:opacity-50",
            className
          )}
        >
          <SelectPrimitive.Value placeholder={placeholderText} />
          <SelectPrimitive.Icon asChild>
            <ChevronDown className="h-4 w-4 opacity-70" />
          </SelectPrimitive.Icon>
        </SelectPrimitive.Trigger>

        {name ? <input type="hidden" name={name} required={required} value={selectedValue} /> : null}

        <SelectPrimitive.Portal>
          <SelectPrimitive.Content
            className="relative z-50 max-h-96 min-w-[8rem] overflow-hidden rounded-md border border-outline/25 bg-surface-container text-on-surface shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out"
            position="popper"
          >
            <SelectPrimitive.ScrollUpButton className="flex cursor-default items-center justify-center py-1">
              <ChevronUp className="h-4 w-4" />
            </SelectPrimitive.ScrollUpButton>
            <SelectPrimitive.Viewport className="p-1">
              {options
                .filter((option) => !option.isPlaceholderOption)
                .map((option) => (
                  <SelectPrimitive.Item
                    key={option.key}
                    value={option.value}
                    disabled={option.disabled}
                    className="relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-surface-bright data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                  >
                    <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                      <SelectPrimitive.ItemIndicator>
                        <Check className="h-4 w-4" />
                      </SelectPrimitive.ItemIndicator>
                    </span>
                    <SelectPrimitive.ItemText>{option.label}</SelectPrimitive.ItemText>
                  </SelectPrimitive.Item>
                ))}
            </SelectPrimitive.Viewport>
            <SelectPrimitive.ScrollDownButton className="flex cursor-default items-center justify-center py-1">
              <ChevronDown className="h-4 w-4" />
            </SelectPrimitive.ScrollDownButton>
          </SelectPrimitive.Content>
        </SelectPrimitive.Portal>
      </SelectPrimitive.Root>
    );
  }
);
Select.displayName = "Select";

export { Select };