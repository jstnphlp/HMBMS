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
  reportPeriod: string;
  onReportPeriodChange: (value: string) => void;
  reportCategory: string;
  onReportCategoryChange: (value: string) => void;
  program: string;
  onProgramChange: (value: string) => void;
  dateFrom: string;
  onDateFromChange: (value: string) => void;
  dateTo: string;
  onDateToChange: (value: string) => void;
  selectedDate: string;
  onSelectedDateChange: (value: string) => void;
  selectedMonth: string;
  onSelectedMonthChange: (value: string) => void;
  selectedYear: string;
  onSelectedYearChange: (value: string) => void;
  onGenerate: () => void;
  isPending: boolean;
  onSaveReport: () => void;
  isSaving: boolean;
  canSave: boolean;
}

export function ReportFilters({
  reportPeriod,
  onReportPeriodChange,
  reportCategory,
  onReportCategoryChange,
  program,
  onProgramChange,
  dateFrom,
  onDateFromChange,
  dateTo,
  onDateToChange,
  selectedDate,
  onSelectedDateChange,
  selectedMonth,
  onSelectedMonthChange,
  selectedYear,
  onSelectedYearChange,
  onGenerate,
  isPending,
  onSaveReport,
  isSaving,
  canSave,
}: ReportFiltersProps) {
  const showRange = reportPeriod === "CUSTOM" || reportPeriod === "WEEKLY";
  const showDate = reportPeriod === "DAILY";
  const showMonth = reportPeriod === "MONTHLY";
  const showYear = reportPeriod === "YEARLY";

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
          <Button size="sm" disabled={!canSave || isSaving} onClick={onSaveReport}>
            <Plus className="h-4 w-4" />
            <BarChart3 className="h-4 w-4" />
            {isSaving ? "Saving..." : "Save Report"}
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-4 rounded border border-border bg-card p-4 lg:flex-row lg:items-end">
        <div className="grid flex-1 grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs font-medium text-muted-foreground">
              Report Period
            </Label>
            <Select value={reportPeriod} onValueChange={onReportPeriodChange}>
              <SelectTrigger className="bg-card">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="DAILY">Daily</SelectItem>
                <SelectItem value="WEEKLY">Weekly</SelectItem>
                <SelectItem value="MONTHLY">Monthly</SelectItem>
                <SelectItem value="YEARLY">Yearly</SelectItem>
                <SelectItem value="CUSTOM">Custom</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs font-medium text-muted-foreground">
              Report Category
            </Label>
            <Select value={reportCategory} onValueChange={onReportCategoryChange}>
              <SelectTrigger className="bg-card">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All</SelectItem>
                <SelectItem value="COLLECTION">Collection</SelectItem>
                <SelectItem value="PROCESSING">Processing</SelectItem>
                <SelectItem value="INVENTORY">Inventory</SelectItem>
                <SelectItem value="DISPENSING">Dispensing</SelectItem>
                <SelectItem value="DISPOSAL">Disposal</SelectItem>
                <SelectItem value="DONOR">Donor</SelectItem>
                <SelectItem value="RECIPIENT">Recipient</SelectItem>
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
          {showDate && (
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-medium text-muted-foreground">
                Date
              </Label>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => onSelectedDateChange(e.target.value)}
                className="bg-card"
              />
            </div>
          )}
          {showMonth && (
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-medium text-muted-foreground">
                Month
              </Label>
              <Input
                type="month"
                value={selectedMonth}
                onChange={(e) => onSelectedMonthChange(e.target.value)}
                className="bg-card"
              />
            </div>
          )}
          {showYear && (
            <div className="flex flex-col gap-1.5">
              <Label className="text-xs font-medium text-muted-foreground">
                Year
              </Label>
              <Input
                type="number"
                min="2000"
                max="2100"
                value={selectedYear}
                onChange={(e) => onSelectedYearChange(e.target.value)}
                className="bg-card"
              />
            </div>
          )}
          {showRange && (
            <>
              <div className="flex flex-col gap-1.5">
                <Label className="text-xs font-medium text-muted-foreground">
                  {reportPeriod === "WEEKLY" ? "Week Start" : "Date Range (Start)"}
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
                  disabled={reportPeriod === "WEEKLY"}
                />
              </div>
            </>
          )}
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
