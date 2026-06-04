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
  role: string;
}

const roleDepartments: Record<string, string> = {
  ADMIN: "Administration",
  STAFF: "Clinical Operations",
  DONOR: "Donor Services",
};

function getInitials(email: string): string {
  return email
    .split("@")[0]
    .split(/[._-]/)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .slice(0, 2)
    .join("");
}

function getAvatarColor(userId: number): string {
  const colors = [
    "bg-primary/10 text-primary",
    "bg-secondary text-secondary-foreground",
    "bg-accent text-accent-foreground",
  ];
  return colors[userId % colors.length] ?? colors[0];
}

interface StaffDirectoryTableProps {
  staff: StaffMember[];
}

export function StaffDirectoryTable({ staff }: StaffDirectoryTableProps) {
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
                Name
              </TableHead>
              <TableHead className="py-2 px-4 font-semibold text-muted-foreground">
                Role
              </TableHead>
              <TableHead className="py-2 px-4 font-semibold text-muted-foreground">
                Department
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
                  index % 2 === 1 ? "bg-muted/50" : "bg-background"
                }
              >
                <TableCell className="py-2 px-4">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${getAvatarColor(member.user_id)}`}
                  >
                    {getInitials(member.email)}
                  </div>
                </TableCell>
                <TableCell className="py-2 px-4 font-medium text-foreground">
                  {member.email}
                </TableCell>
                <TableCell className="py-2 px-4 text-muted-foreground">
                  {member.role}
                </TableCell>
                <TableCell className="py-2 px-4 text-muted-foreground">
                  {roleDepartments[member.role] ?? "General"}
                </TableCell>
                <TableCell className="py-2 px-4">
                  <Badge
                    variant="default"
                    className="bg-primary/10 text-primary border-transparent text-[11px]"
                  >
                    Active
                  </Badge>
                </TableCell>
                <TableCell className="py-2 px-4 text-right">
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    className="text-muted-foreground hover:text-primary"
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
      <div className="flex justify-center border-t border-border bg-background p-3">
        <Button
          variant="link"
          className="text-primary text-xs font-medium"
        >
          View All Staff Directory
        </Button>
      </div>
    </div>
  );
}
