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
import { BarChart3, Download, Plus } from "lucide-react";

export function ReportFilters() {
  return (
    <div className="flex flex-col gap-4">
      {/* Page Header */}
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
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4" />
            Export All
          </Button>
          <Button size="sm">
            <Plus className="h-4 w-4" />
            <BarChart3 className="h-4 w-4" />
            New Custom Report
          </Button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col gap-4 rounded border border-border bg-card p-4 lg:flex-row lg:items-end">
        <div className="grid flex-1 grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs font-medium text-muted-foreground">
              Report Type
            </Label>
            <Select defaultValue="inventory">
              <SelectTrigger className="bg-card">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="inventory">Inventory Levels</SelectItem>
                <SelectItem value="donor">Donor Acquisition</SelectItem>
                <SelectItem value="dispensation">Dispensation Logs</SelectItem>
                <SelectItem value="lab">Lab Testing Yields</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs font-medium text-muted-foreground">
              Program Focus
            </Label>
            <Select defaultValue="all">
              <SelectTrigger className="bg-card">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Programs</SelectItem>
                <SelectItem value="supsup">Supsup Todo</SelectItem>
                <SelectItem value="milkyway">Milky Way</SelectItem>
                <SelectItem value="momsact">{"Mom's Act"}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs font-medium text-muted-foreground">
              Date Range (Start)
            </Label>
            <Input type="date" defaultValue="2023-09-01" className="bg-card" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label className="text-xs font-medium text-muted-foreground">
              Date Range (End)
            </Label>
            <Input type="date" defaultValue="2023-10-31" className="bg-card" />
          </div>
        </div>
        <div className="flex items-end border-l border-border pl-4">
          <Button
            variant="secondary"
            size="sm"
            className="font-semibold"
          >
            Generate
          </Button>
        </div>
      </div>
    </div>
  );
}
