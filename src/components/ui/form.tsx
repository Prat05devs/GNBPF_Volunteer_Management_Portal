"use client";

import * as React from "react";
import * as LabelPrimitive from "@radix-ui/react-label";
import { Slot } from "@radix-ui/react-slot";
import {
  Controller,
  FormProvider,
  type ControllerProps,
  type FieldPath,
  type FieldValues,
  type ControllerFieldState,
  type UseFormStateReturn,
} from "react-hook-form";

import { cn } from "@/lib/utils";

const Form = FormProvider;

const FormField = <TFieldValues extends FieldValues, TName extends FieldPath<TFieldValues>>({
  ...props
}: ControllerProps<TFieldValues, TName>) => {
  return (
    <Controller
      {...props}
      render={({ field, fieldState, formState }) => (
        <FormItemContext.Provider value={{ id: field.name, fieldState, formState }}>
          {props.render({ field, fieldState, formState })}
        </FormItemContext.Provider>
      )}
    />
  );
};

const FormItemContext = React.createContext<{
  id: string;
  formItemId?: string;
  formDescriptionId?: string;
  formMessageId?: string;
  fieldState: ControllerFieldState;
  formState: UseFormStateReturn<FieldValues>;
} | null>(null);

const useFormField = () => {
  const fieldContext = React.useContext(FormItemContext);
  const itemContext = React.useContext(FormItemInternalContext);

  const formItemId = fieldContext?.formItemId ?? itemContext?.id;
  const formDescriptionId = fieldContext?.formDescriptionId ?? itemContext?.descriptionId;
  const formMessageId = fieldContext?.formMessageId ?? itemContext?.messageId;

  return {
    id: fieldContext?.id ?? "",
    name: fieldContext?.id ?? "",
    formItemId,
    formDescriptionId,
    formMessageId,
    fieldState: fieldContext?.fieldState,
  };
};

const FormItemInternalContext = React.createContext<{
  id: string;
  descriptionId?: string;
  messageId?: string;
} | null>(null);

const FormItem = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    const id = React.useId();
    const descriptionId = `${id}-description`;
    const messageId = `${id}-message`;

    return (
      <FormItemInternalContext.Provider value={{ id, descriptionId, messageId }}>
        <div ref={ref} className={cn("space-y-2", className)} {...props} />
      </FormItemInternalContext.Provider>
    );
  },
);
FormItem.displayName = "FormItem";

const FormLabel = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>
>(({ className, ...props }, ref) => {
  const { formItemId, fieldState } = useFormField();
  return (
    <LabelPrimitive.Root
      ref={ref}
      className={cn(fieldState?.error && "text-destructive", className)}
      htmlFor={formItemId}
      {...props}
    />
  );
});
FormLabel.displayName = "FormLabel";

const FormControl = React.forwardRef<
  React.ElementRef<typeof Slot>,
  React.ComponentPropsWithoutRef<typeof Slot>
>(({ ...props }, ref) => {
  const { formItemId, formDescriptionId, formMessageId } = useFormField();

  return (
    <Slot
      ref={ref}
      id={formItemId}
      aria-describedby={formDescriptionId}
      aria-errormessage={formMessageId}
      {...props}
    />
  );
});
FormControl.displayName = "FormControl";

const FormDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => {
  const { formDescriptionId } = useFormField();

  return (
    <p ref={ref} id={formDescriptionId} className={cn("text-sm text-muted-foreground", className)} {...props} />
  );
});
FormDescription.displayName = "FormDescription";

const FormMessage = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, children, ...props }, ref) => {
    const { formMessageId, fieldState } = useFormField();
    const body = fieldState?.error ? String(fieldState.error?.message ?? children) : children;
    if (!body) {
      return null;
    }
    return (
      <p
        ref={ref}
        id={formMessageId}
        className={cn("text-sm font-medium text-destructive", className)}
        {...props}
      >
        {body}
      </p>
    );
  },
);
FormMessage.displayName = "FormMessage";

export { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage, useFormField };

