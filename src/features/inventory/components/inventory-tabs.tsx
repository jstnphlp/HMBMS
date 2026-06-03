"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/core/ui/tabs";
import { Card, CardContent } from "@/core/ui/card";
import { Badge } from "@/core/ui/badge";
import { Droplets, Trash2, Activity } from "lucide-react";
import { CollectionLogsTable } from "./collection-logs-table";
import { DisposalLogsTable } from "./disposal-logs-table";
import type { CollectionLogEntry, DisposalLogEntry } from "../queries";

interface InventoryTabsProps {
  collections: CollectionLogEntry[];
  disposals: DisposalLogEntry[];
}

export function InventoryTabs({ collections, disposals }: InventoryTabsProps) {
  const recentCollections = collections.slice(0, 5);
  const recentDisposals = disposals.slice(0, 5);

  return (
    <Tabs defaultValue="overview" className="w-full">
      <TabsList variant="line" className="w-full justify-start border-b border-border px-0">
        <TabsTrigger
          value="overview"
          className="gap-2 rounded-none px-4 py-2.5 text-xs font-medium tracking-wide data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary"
        >
          <Activity className="h-3.5 w-3.5" />
          Overview
        </TabsTrigger>
        <TabsTrigger
          value="collections"
          className="gap-2 rounded-none px-4 py-2.5 text-xs font-medium tracking-wide data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:text-primary"
        >
          <Droplets className="h-3.5 w-3.5" />
          Collections
          <Badge variant="secondary" className="ml-1 rounded-sm px-1.5 py-0 text-[10px]">
            {collections.length}
          </Badge>
        </TabsTrigger>
        <TabsTrigger
          value="disposals"
          className="gap-2 rounded-none px-4 py-2.5 text-xs font-medium tracking-wide data-[state=active]:border-b-2 data-[state=active]:border-destructive data-[state=active]:text-destructive"
        >
          <Trash2 className="h-3.5 w-3.5" />
          Disposals
          <Badge variant="destructive" className="ml-1 rounded-sm px-1.5 py-0 text-[10px]">
            {disposals.length}
          </Badge>
        </TabsTrigger>
      </TabsList>

      {/* Overview Tab: Combined recent activity */}
      <TabsContent value="overview" className="mt-4">
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
          {/* Recent Collections Summary */}
          <Card className="border-border bg-card">
            <CardContent className="p-0">
              <div className="flex items-center justify-between border-b border-border bg-muted px-4 py-3">
                <div className="flex items-center gap-2">
                  <Droplets className="h-4 w-4 text-primary" />
                  <h3 className="text-xs leading-4 font-semibold tracking-wider text-foreground uppercase">
                    Recent Collections
                  </h3>
                </div>
                <Badge variant="outline" className="rounded-sm border-border bg-accent text-xs text-muted-foreground">
                  {collections.length} total
                </Badge>
              </div>
              <div className="divide-y divide-border/50">
                {recentCollections.length === 0 ? (
                  <p className="px-4 py-8 text-center text-sm text-muted-foreground">
                    No collections recorded yet.
                  </p>
                ) : (
                  recentCollections.map((c) => (
                    <div
                      key={c.ctn}
                      className="flex items-center justify-between px-4 py-3 transition-colors hover:bg-muted/50"
                    >
                      <div className="flex flex-col">
                        <span className="font-mono text-xs font-medium text-primary">
                          COL-{String(c.ctn).padStart(4, "0")}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {c.donorName} &middot; {c.program.replace("_", " ")}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-sm font-medium text-foreground">
                          {c.volume.toLocaleString()} mL
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent Disposals Summary */}
          <Card className="border-border bg-card">
            <CardContent className="p-0">
              <div className="flex items-center justify-between border-b border-border bg-muted px-4 py-3">
                <div className="flex items-center gap-2">
                  <Trash2 className="h-4 w-4 text-destructive" />
                  <h3 className="text-xs leading-4 font-semibold tracking-wider text-foreground uppercase">
                    Recent Disposals
                  </h3>
                </div>
                <Badge variant="outline" className="rounded-sm border-border bg-accent text-xs text-muted-foreground">
                  {disposals.length} total
                </Badge>
              </div>
              <div className="divide-y divide-border/50">
                {recentDisposals.length === 0 ? (
                  <p className="px-4 py-8 text-center text-sm text-muted-foreground">
                    No disposals recorded yet.
                  </p>
                ) : (
                  recentDisposals.map((d) => (
                    <div
                      key={d.disposalId}
                      className="flex items-center justify-between px-4 py-3 transition-colors hover:bg-muted/50"
                    >
                      <div className="flex flex-col">
                        <span className="font-mono text-xs font-medium text-foreground">
                          {d.batchCode}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {d.reason} &middot; {d.disposedByName}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-sm font-medium text-destructive">
                          {d.volume.toLocaleString()} mL
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      {/* Collections Tab: Full table */}
      <TabsContent value="collections" className="mt-4">
        <CollectionLogsTable logs={collections} />
      </TabsContent>

      {/* Disposals Tab: Full table */}
      <TabsContent value="disposals" className="mt-4">
        <DisposalLogsTable logs={disposals} />
      </TabsContent>
    </Tabs>
  );
}
