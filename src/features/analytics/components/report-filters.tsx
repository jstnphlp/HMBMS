"use client";

import { Button } from "@/core/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/core/ui/select";
import { Input } from "@/core/ui/input";
import { Label } from "@/core/ui/label";
import { BarChart3, Download, Plus, Loader2 } from "lucide-react";

interface ReportFiltersProps {
  reportType: string;
  onReportTypeChange: (value: string) => void;
  program: string;
  onProgramChange: (value: string) => void;
  dateFrom: string;
  onDateFromChange: (value: string) => void;
  dateTo: string;
  onDateToChange: (value: string) => void;
  onGenerate: () => void;
  isPending: boolean;
}

export function ReportFilters({
  reportType,
  onReportTypeChange,
  program,
  onProgramChange,
  dateFrom,
  onDateFromChange,
  dateTo,
  onDateToChange,
  onGenerate,
  isPending,
}: ReportFiltersProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-lg leading-8 font-semibold tracking-tight text-foreground">
            Clinical Reports & Analytics
          </h2>
          <p className="text-sm text-muted-foreground">
            Generate, view, and export systemic operational data.
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="sm" disabled>
            <Download className="h-4 w-4" />
            Export All
          </Button>
          <Button size="sm" disabled>
            <Plus className="h-4 w-4" />
            <BarChart3 className="h-4 w-4" />
            New Custom Report
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-4 rounded border border-border bg-card p-4 lg:flex-row lg:items-end">
        <div className="grid flex-1 grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs font-medium text-muted-foreground">
              Report Type
            </Label>
            <Select value={reportType} onValueChange={onReportTypeChange}>
              <SelectTrigger className="bg-card">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Inventory Levels">Inventory Levels</SelectItem>
                <SelectItem value="Donor Acquisition">Donor Acquisition</SelectItem>
                <SelectItem value="Dispensation Logs">Dispensation Logs</SelectItem>
                <SelectItem value="Lab Testing Yields">Lab Testing Yields</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs font-medium text-muted-foreground">
              Program Focus
            </Label>
            <Select value={program} onValueChange={onProgramChange}>
              <SelectTrigger className="bg-card">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Programs</SelectItem>
                <SelectItem value="SUPSUP_TODO">Supsup Todo</SelectItem>
                <SelectItem value="MILKY_WAY">Milky Way</SelectItem>
                <SelectItem value="MOMS_ACT">{"Mom's Act"}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs font-medium text-muted-foreground">
              Date Range (Start)
            </Label>
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => onDateFromChange(e.target.value)}
              className="bg-card"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs font-medium text-muted-foreground">
              Date Range (End)
            </Label>
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => onDateToChange(e.target.value)}
              className="bg-card"
            />
          </div>
        </div>
        <div className="flex items-end border-l border-border pl-4">
          <Button
            size="sm"
            className="bg-primary text-primary-foreground font-semibold"
            disabled={isPending}
            onClick={onGenerate}
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
            ) : null}
            Generate
          </Button>
        </div>
      </div>
    </div>
  );
}
