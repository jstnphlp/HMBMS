"use client";

import * as React from "react";
import { Settings } from "lucide-react";

interface ProtocolToggleProps {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  destructive?: boolean;
}

function ProtocolToggle({
  label,
  description,
  checked,
  onChange,
  destructive = false,
}: ProtocolToggleProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="font-medium text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <label className="relative inline-flex cursor-pointer items-center">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="sr-only peer"
        />
        <div
          className={`
            h-5 w-9 rounded-full transition-colors
            after:absolute after:top-[2px] after:left-[2px]
            after:h-4 after:w-4 after:rounded-full after:border after:border-border
            after:bg-background after:transition-all after:content-['']
            peer-checked:after:translate-x-full
            ${
              checked
                ? destructive
                  ? "bg-destructive"
                  : "bg-primary"
                : "bg-border"
            }
          `}
        />
      </label>
    </div>
  );
}

interface SystemProtocolsProps {
  initialTwoFactor?: boolean;
  initialAutoArchive?: boolean;
  initialMaintenance?: boolean;
  onToggle?: (key: string, value: boolean) => void;
}

export function SystemProtocols({
  initialTwoFactor = true,
  initialAutoArchive = true,
  initialMaintenance = false,
  onToggle,
}: SystemProtocolsProps) {
  const [twoFactor, setTwoFactor] = React.useState(initialTwoFactor);
  const [autoArchive, setAutoArchive] = React.useState(initialAutoArchive);
  const [maintenance, setMaintenance] = React.useState(initialMaintenance);

  function handleToggle(key: string, value: boolean) {
    switch (key) {
      case "twoFactor":
        setTwoFactor(value);
        break;
      case "autoArchive":
        setAutoArchive(value);
        break;
      case "maintenance":
        setMaintenance(value);
        break;
    }
    onToggle?.(key, value);
  }

  return (
    <div className="border border-border bg-background p-4 rounded-sm">
      <h3 className="mb-4 flex items-center gap-2 text-sm font-semibold text-foreground">
        <Settings className="h-5 w-5 text-primary" />
        System Protocols
      </h3>
      <div className="space-y-4 text-sm">
        <ProtocolToggle
          label="Two-Factor Auth"
          description="Mandatory for all staff"
          checked={twoFactor}
          onChange={(v) => handleToggle("twoFactor", v)}
        />
        <div className="h-px w-full bg-border" />
        <ProtocolToggle
          label="Auto-Archive Logs"
          description="Archive after 90 days"
          checked={autoArchive}
          onChange={(v) => handleToggle("autoArchive", v)}
        />
        <div className="h-px w-full bg-border" />
        <ProtocolToggle
          label="Maintenance Mode"
          description="Suspend public access"
          checked={maintenance}
          onChange={(v) => handleToggle("maintenance", v)}
          destructive
        />
      </div>
    </div>
  );
}
