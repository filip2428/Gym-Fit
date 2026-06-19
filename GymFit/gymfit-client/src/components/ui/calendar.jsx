import * as React from "react";
import { DayPicker } from "react-day-picker";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";

function Calendar({ className, classNames, showOutsideDays = true, ...props }) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-3", className)}
      classNames={{
        root: "rdp",
        months: "flex flex-col sm:flex-row gap-4",
        month: "flex flex-col gap-4 relative",
        month_caption: "flex justify-center pt-1 relative items-center w-full",
        caption_label: "text-sm font-medium",
        nav: "absolute top-1 left-0 right-0 flex justify-between items-center px-1",
        button_previous: cn(
          "inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground disabled:opacity-50"
        ),
        button_next: cn(
          "inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground disabled:opacity-50"
        ),
        month_grid: "w-full border-collapse",
        weekdays: "flex",
        weekday: "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem] text-center",
        week: "flex w-full mt-2",
        day: "relative p-0 text-center text-sm focus-within:relative focus-within:z-20",
        day_button: cn(
          "inline-flex h-9 w-9 items-center justify-center rounded-md text-sm font-normal hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        ),
        selected:
          "bg-primary text-primary-foreground rounded-md hover:bg-primary hover:text-primary-foreground",
        today: "bg-accent text-accent-foreground rounded-md",
        outside: "text-muted-foreground opacity-50",
        disabled: "text-muted-foreground opacity-50",
        hidden: "invisible",
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation }) =>
          orientation === "left" ? (
            <ChevronLeft className="h-4 w-4 pointer-events-none" />
          ) : (
            <ChevronRight className="h-4 w-4 pointer-events-none" />
          ),
      }}
      {...props}
    />
  );
}

export { Calendar };
