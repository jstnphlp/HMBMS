"use client";

import { Input } from "@/core/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/core/ui/select";
import { Search } from "lucide-react";

interface DispensingFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  programFilter: string;
  onProgramChange: (value: string) => void;
}

export function DispensingFilters({
  search,
  onSearchChange,
  programFilter,
  onProgramChange,
}: DispensingFiltersProps) {
  return (
    <div className="flex gap-2 items-center">
      <div className="relative flex-1">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground size-3.5" />
        <Input
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search by batch code or beneficiary..."
          className="h-9 pl-8 text-xs bg-background border-border focus:ring-primary"
        />
      </div>
      <Select value={programFilter} onValueChange={onProgramChange}>
        <SelectTrigger className="h-9 text-xs bg-background border-border w-[160px]">
          <SelectValue placeholder="All Programs" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">All Programs</SelectItem>
          <SelectItem value="SUPSUP_TODO">Supsup Todo</SelectItem>
          <SelectItem value="MILKY_WAY">Milky Way</SelectItem>
          <SelectItem value="MOMS_ACT">Mom&apos;s Act</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
