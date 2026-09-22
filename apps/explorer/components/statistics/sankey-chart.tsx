"use client";

import { useMemo } from "react";
import {
  sankey,
  sankeyLinkHorizontal,
  type SankeyNodeMinimal,
  type SankeyLinkMinimal,
} from "d3-sankey";
import type { BlockchainMeta, PathValue } from "@/lib/types";

interface NodeExtra {
  name: string;
  display: string;
}
interface LinkExtra {
  value: number;
}
type SNode = SankeyNodeMinimal<NodeExtra, LinkExtra> & NodeExtra;
type SLink = SankeyLinkMinimal<NodeExtra, LinkExtra> & LinkExtra;

const WIDTH = 960;
const HEIGHT = 420;
const MAX_PATHS = 12;

const compactUsd = (v: number) =>
  v >= 1_000_000
    ? `$${(v / 1_000_000).toFixed(2)}M`
    : v >= 1_000
      ? `$${(v / 1_000).toFixed(1)}K`
      : `$${v.toFixed(2)}`;

export default function SankeyChart({
  paths,
  meta,
}: {
  paths: PathValue[] | undefined;
  meta: Map<string, BlockchainMeta>;
}) {
  const graph = useMemo(() => {
    const rows = (paths ?? []).slice(0, MAX_PATHS);
    if (rows.length === 0) return null;

    const nodeIndex = new Map<string, number>();
    const nodes: NodeExtra[] = [];
    const indexOf = (name: string) => {
      let idx = nodeIndex.get(name);
      if (idx === undefined) {
        idx = nodes.length;
        nodeIndex.set(name, idx);
        nodes.push({
          name,
          display: meta.get(name)?.displayName ?? name,
        });
      }
      return idx;
    };

    const links = rows.map((r) => ({
      source: indexOf(r.key.source),
      target: indexOf(r.key.destination),
      value: r.value,
    }));

    return sankey<NodeExtra, LinkExtra>()
      .nodeWidth(14)
      .nodePadding(18)
      .extent([
        [8, 8],
        [WIDTH - 8, HEIGHT - 8],
      ])({ nodes, links } as never) as { nodes: SNode[]; links: SLink[] };
  }, [paths, meta]);

  if (!graph) {
    return (
      <div className="glass-card rounded-2xl p-5">
        <h2 className="font-display text-base font-semibold text-white">Flow by volume</h2>
        <p className="text-xs text-neutral-500">Source chain → destination chain</p>
        <div className="py-14 text-center text-sm text-neutral-600">No path data yet.</div>
      </div>
    );
  }

  const linkPath = sankeyLinkHorizontal<SNode, SLink>();

  return (
    <div className="glass-card rounded-2xl p-5">
      <h2 className="font-display text-base font-semibold text-white">Flow by volume</h2>
      <p className="mb-4 text-xs text-neutral-500">Source chain → destination chain</p>
      <div className="w-full overflow-x-auto">
        <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="min-w-[640px]">
          <defs>
            <linearGradient id="sankeyLink" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#0FBD6B" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#13F187" stopOpacity={0.55} />
            </linearGradient>
          </defs>

          {graph.links.map((link, i) => (
            <path
              key={i}
              d={linkPath(link) ?? undefined}
              fill="none"
              stroke="url(#sankeyLink)"
              strokeWidth={Math.max(1, link.width ?? 1)}
            >
              <title>
                {(link.source as SNode).display} → {(link.target as SNode).display}:{" "}
                {compactUsd(link.value)}
              </title>
            </path>
          ))}

          {graph.nodes.map((node, i) => {
            const isSource = (node.sourceLinks?.length ?? 0) > 0;
            const x = node.x0 ?? 0;
            const y = node.y0 ?? 0;
            const h = Math.max(2, (node.y1 ?? 0) - y);
            const labelX = isSource ? x + 20 : x - 6;
            const anchor = isSource ? "start" : "end";
            return (
              <g key={i}>
                <rect
                  x={x}
                  y={y}
                  width={14}
                  height={h}
                  rx={3}
                  fill={isSource ? "#0FBD6B" : "#13F187"}
                  opacity={0.9}
                />
                <text
                  x={labelX}
                  y={y + h / 2}
                  dy="0.35em"
                  textAnchor={anchor}
                  fill="#d4d4d4"
                  fontSize={12}
                >
                  {node.display}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
