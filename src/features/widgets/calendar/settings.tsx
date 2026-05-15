"use client";

import { Field, Segmented } from "@/features/widgets/core/widget-settings";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import {
  disconnectGoogleServices,
} from "@/features/auth/google-services";
import { useGoogleServicesConnected } from "@/features/auth/google-connect-gate";
import type { WidgetSettingsProps } from "@/types/widget.types";
import type { CalendarConfig } from "./config";

const RANGE_OPTIONS = [
  { value: "1", label: "Today" },
  { value: "3", label: "3 days" },
  { value: "7", label: "Week" },
];

export function CalendarSettings({ config, onChange }: WidgetSettingsProps<CalendarConfig>) {
  const connected = useGoogleServicesConnected();
  return (
    <div className="flex flex-col gap-3">
      <Field label="Range">
        <Segmented
          value={String(config.daysAhead)}
          options={RANGE_OPTIONS}
          onChange={(v) => onChange({ ...config, daysAhead: Number(v) })}
        />
      </Field>
      {connected && (
        <Button
          variant="ghost"
          size="xs"
          onClick={() => void disconnectGoogleServices()}
          className="self-start"
        >
          <Trash2 className="h-3 w-3" aria-hidden />
          Disconnect Google
        </Button>
      )}
    </div>
  );
}
