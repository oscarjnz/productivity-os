"use client";

import { Field, TextInput, Segmented } from "@/features/widgets/core/widget-settings";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { disconnectGoogleServices } from "@/features/auth/google-services";
import { useGoogleServicesConnected } from "@/features/auth/google-connect-gate";
import type { WidgetSettingsProps } from "@/types/widget.types";
import type { GmailConfig } from "./config";

const COUNT_OPTIONS = [
  { value: "5", label: "5" },
  { value: "8", label: "8" },
  { value: "12", label: "12" },
  { value: "20", label: "20" },
];

export function GmailSettings({ config, onChange }: WidgetSettingsProps<GmailConfig>) {
  const connected = useGoogleServicesConnected();
  return (
    <div className="flex flex-col gap-3">
      <Field label="Query" hint="Gmail search syntax.">
        <TextInput
          value={config.query}
          placeholder="is:unread in:inbox"
          onChange={(query) => onChange({ ...config, query })}
        />
      </Field>
      <Field label="Show">
        <Segmented
          value={String(config.maxThreads)}
          options={COUNT_OPTIONS}
          onChange={(v) => onChange({ ...config, maxThreads: Number(v) })}
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
