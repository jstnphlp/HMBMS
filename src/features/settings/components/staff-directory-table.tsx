"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/core/ui/table";
import { Badge } from "@/core/ui/badge";
import { Button } from "@/core/ui/button";
import { Settings } from "lucide-react";

interface StaffMember {
  user_id: number;
  email: string;
  full_name: string;
  role: string;
  is_active: boolean;
  created_at: Date;
}

function getInitials(fullName: string, email: string): string {
  if (fullName && fullName.trim().length > 0) {
    return fullName
      .split(/\s+/)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .slice(0, 2)
      .join("");
  }
  return email
    .split("@")[0]
    .split(/[._-]/)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .slice(0, 2)
    .join("");
}

interface StaffDirectoryTableProps {
  staff: StaffMember[];
  onEdit?: (member: StaffMember) => void;
}

export function StaffDirectoryTable({ staff, onEdit }: StaffDirectoryTableProps) {
  return (
    <div className="flex flex-col border border-border bg-background rounded-sm">
      <div className="border-b border-border bg-muted p-4 rounded-t-sm">
        <h3 className="text-base font-semibold text-foreground">
          Staff Directory &amp; Roles
        </h3>
      </div>
      <div className="flex-1 overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-b border-border bg-background hover:bg-background">
              <TableHead className="w-12 py-2 px-4" />
              <TableHead className="py-2 px-4 font-semibold text-muted-foreground">
                Full Name
              </TableHead>
              <TableHead className="py-2 px-4 font-semibold text-muted-foreground">
                Username
              </TableHead>
              <TableHead className="py-2 px-4 font-semibold text-muted-foreground">
                Role
              </TableHead>
              <TableHead className="py-2 px-4 font-semibold text-muted-foreground">
                Status
              </TableHead>
              <TableHead className="py-2 px-4 text-right font-semibold text-muted-foreground">
                Actions
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {staff.map((member, index) => (
              <TableRow
                key={member.user_id}
                className={
                  index % 2 === 1 ? "bg-muted/40" : "bg-background"
                }
              >
                <TableCell className="py-2 px-4 h-10">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">
                    {getInitials(member.full_name, member.email)}
                  </div>
                </TableCell>
                <TableCell className="py-2 px-4 font-medium text-foreground">
                  {member.full_name || "—"}
                </TableCell>
                <TableCell className="py-2 px-4 text-muted-foreground">
                  {member.email}
                </TableCell>
                <TableCell className="py-2 px-4">
                  <Badge
                    variant="default"
                    className={
                      member.role === "ADMIN"
                        ? "bg-primary/10 text-primary border-transparent text-[11px]"
                        : "bg-muted text-muted-foreground border-transparent text-[11px]"
                    }
                  >
                    {member.role}
                  </Badge>
                </TableCell>
                <TableCell className="py-2 px-4">
                  <Badge
                    variant="default"
                    className={
                      member.is_active
                        ? "bg-primary/10 text-primary border-transparent text-[11px]"
                        : "bg-muted text-muted-foreground border-transparent text-[11px]"
                    }
                  >
                    {member.is_active ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell className="py-2 px-4 text-right">
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    className="text-muted-foreground hover:text-primary"
                    title="Edit staff member"
                    onClick={() => onEdit?.(member)}
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {staff.length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="py-8 text-center text-muted-foreground"
                >
                  No staff members found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
