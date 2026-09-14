import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import type {
  TimelineNode,
  EmotionPoint,
  CharacterNode,
  CharacterEdge,
  EmotionKind,
  LifeMapLocation,
} from "@/types";

/**
 * AI 特色可视化 —— 需求文档第十七节：
 * 人生时间轴 / 情绪曲线 / 人生地图 / 人物关系图。均为纯前端渲染（接入后端后由 AI 生成数据）。
 */

// ---------- 人生时间轴 ----------

export function Timeline({
  nodes,
  onJump,
}: {
  nodes: TimelineNode[];
  /** 点击节点跳转到对应章节（需求第十七节） */
  onJump?: (chapterOrder: number) => void;
}) {
  return (
    <ol className="relative ml-2 space-y-5 border-l border-divider pl-6">
      {nodes.map((n) => {
        const jumpable = !!onJump && !!n.chapterOrder;
        return (
          <li key={n.id} className="relative">
            <span className="absolute -left-[31px] top-1.5 h-2.5 w-2.5 rounded-full bg-primary ring-4 ring-primary/15" />
            <button
              type="button"
              disabled={!jumpable}
              onClick={() => jumpable && onJump!(n.chapterOrder!)}
              className={cn(
                "flex w-full flex-wrap items-baseline gap-x-3 gap-y-0.5 text-left",
                jumpable ? "cursor-pointer" : "cursor-default"
              )}
            >
              <span className="font-serif text-sm font-bold tabular-nums text-primary">{n.year}</span>
              <span className="text-sm font-medium text-foreground">{n.title}</span>
              {n.chapterOrder && (
                <span className="text-xs text-subtle">第 {n.chapterOrder} 章</span>
              )}
            </button>
          </li>
        );
      })}
    </ol>
  );
}

// ---------- 情绪曲线 ----------

const EMOTION_COLOR: Record<EmotionKind, string> = {
  happy: "#22C55E",
  sad: "#F43F5E",
  tense: "#F59E0B",
  hope: "#5B8DEF",
};

const EMOTION_LABEL: Record<EmotionKind, string> = {
  happy: "喜悦",
  sad: "低落",
  tense: "紧绷",
  hope: "希望",
};

export function EmotionCurve({ points }: { points: EmotionPoint[] }) {
  const W = 600;
  const H = 200;
  const padX = 40;
  const padTop = 20;
  const padBottom = 40;

  const xs = (i: number) =>
    points.length === 1 ? W / 2 : padX + (i * (W - padX * 2)) / (points.length - 1);
  const ys = (v: number) => H - padBottom - ((v + 1) / 2) * (H - padTop - padBottom);

  const line = points.map((p, i) => `${xs(i)},${ys(p.value)}`).join(" ");
  const area = `M ${xs(0)},${H - padBottom} L ${line.replace(/ /g, " L ")} L ${xs(
    points.length - 1
  )},${H - padBottom} Z`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="情绪曲线">
      <defs>
        <linearGradient id="emotion-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#5B8DEF" stopOpacity="0.25" />
          <stop offset="100%" stopColor="#5B8DEF" stopOpacity="0" />
        </linearGradient>
      </defs>

      {/* 中线 */}
      <line x1={padX} y1={ys(0)} x2={W - padX} y2={ys(0)} stroke="var(--color-divider)" strokeDasharray="4 4" />

      <path d={area} fill="url(#emotion-fill)" />
      <polyline points={line} fill="none" stroke="#5B8DEF" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />

      {points.map((p, i) => (
        <g key={i}>
          <circle cx={xs(i)} cy={ys(p.value)} r="5" fill={EMOTION_COLOR[p.emotion]} stroke="#fff" strokeWidth="2" />
          <text
            x={xs(i)}
            y={ys(p.value) - 12}
            textAnchor="middle"
            fontSize="11"
            fill={EMOTION_COLOR[p.emotion]}
            fontWeight="600"
          >
            {EMOTION_LABEL[p.emotion]}
          </text>
          <text
            x={xs(i)}
            y={H - padBottom + 18}
            textAnchor="middle"
            fontSize="11"
            fill="var(--color-text-tertiary)"
          >
            {p.label}
          </text>
        </g>
      ))}
    </svg>
  );
}

// ---------- 人物关系图 ----------

export function CharacterGraph({
  nodes,
  edges,
}: {
  nodes: CharacterNode[];
  edges: CharacterEdge[];
}) {
  const W = 600;
  const H = 360;
  const center = { x: W / 2, y: H / 2 };

  const pos = new Map<string, { x: number; y: number }>();
  const main = nodes[0];
  const others = nodes.slice(1);

  if (main) pos.set(main.id, center);
  others.forEach((n, i) => {
    const angle = (i * 2 * Math.PI) / Math.max(others.length, 1) - Math.PI / 2;
    const r = 130;
    pos.set(n.id, { x: center.x + r * Math.cos(angle), y: center.y + r * Math.sin(angle) });
  });

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="人物关系图">
      {edges.map((e, i) => {
        const a = pos.get(e.source);
        const b = pos.get(e.target);
        if (!a || !b) return null;
        const mx = (a.x + b.x) / 2;
        const my = (a.y + b.y) / 2;
        return (
          <g key={i}>
            <line x1={a.x} y1={a.y} x2={b.x} y2={b.y} stroke="var(--color-divider)" strokeWidth="1.5" />
            <rect x={mx - 22} y={my - 10} width="44" height="20" rx="10" fill="var(--color-bg-card)" stroke="var(--color-border)" />
            <text x={mx} y={my + 3} textAnchor="middle" fontSize="11" fill="var(--color-text-secondary)">
              {e.relation}
            </text>
          </g>
        );
      })}

      {nodes.map((n) => {
        const p = pos.get(n.id);
        if (!p) return null;
        const isMain = n.id === main?.id;
        return (
          <g key={n.id}>
            <circle
              cx={p.x}
              cy={p.y}
              r={isMain ? 34 : 26}
              fill={isMain ? "#5B8DEF" : "var(--color-bg-card)"}
              stroke={isMain ? "#5B8DEF" : "var(--color-border)"}
              strokeWidth="1.5"
            />
            <text
              x={p.x}
              y={p.y}
              textAnchor="middle"
              fontSize={isMain ? 14 : 13}
              fontWeight="600"
              fill={isMain ? "#fff" : "var(--color-text-primary)"}
            >
              {n.name}
            </text>
            {n.role && (
              <text
                x={p.x}
                y={p.y + (isMain ? 16 : 16)}
                textAnchor="middle"
                fontSize="10"
                fill={isMain ? "rgba(255,255,255,0.85)" : "var(--color-text-tertiary)"}
              >
                {n.role}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

// ---------- 人生地图 ----------

export function LifeMap({
  locations,
  onJump,
}: {
  locations: LifeMapLocation[];
  onJump?: (chapterOrder: number) => void;
}) {
  const W = 600;
  const H = 340;
  const px = (v: number) => (v / 100) * W;
  const py = (v: number) => (v / 100) * H;

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="人生地图">
        <rect x="0" y="0" width={W} height={H} rx="12" fill="var(--color-bg-hover)" />

        {Array.from({ length: 5 }).map((_, i) => (
          <line
            key={`h${i}`}
            x1="0"
            y1={((i + 1) * H) / 6}
            x2={W}
            y2={((i + 1) * H) / 6}
            stroke="var(--color-divider)"
            strokeWidth="1"
          />
        ))}
        {Array.from({ length: 8 }).map((_, i) => (
          <line
            key={`v${i}`}
            x1={((i + 1) * W) / 9}
            y1="0"
            x2={((i + 1) * W) / 9}
            y2={H}
            stroke="var(--color-divider)"
            strokeWidth="1"
          />
        ))}

        {/* 地点连线（按时间顺序） */}
        {locations.length > 1 && (
          <polyline
            points={locations.map((l) => `${px(l.x)},${py(l.y)}`).join(" ")}
            fill="none"
            stroke="#5B8DEF"
            strokeWidth="2"
            strokeDasharray="5 5"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        )}

        {/* 地点标记 */}
        {locations.map((l) => {
          const jumpable = !!onJump && !!l.chapterOrder;
          return (
            <g
              key={l.id}
              transform={`translate(${px(l.x)},${py(l.y)})`}
              onClick={() => jumpable && onJump!(l.chapterOrder!)}
              className={jumpable ? "cursor-pointer" : undefined}
            >
              <circle r="14" fill="#5B8DEF" opacity="0.15" />
              <circle r="6" fill="#5B8DEF" stroke="#fff" strokeWidth="2" />
              <text
                x="0"
                y="-18"
                textAnchor="middle"
                fontSize="12"
                fontWeight="600"
                fill="var(--color-text-primary)"
              >
                {l.name}
              </text>
            </g>
          );
        })}
      </svg>
      {onJump && (
        <p className="mt-2 text-xs text-subtle">点击地图上的地点，可跳转到对应章节</p>
      )}
    </div>
  );
}

/** 诚实占位：对应 AI 能力尚未接入时展示，不渲染任何伪造数据。 */
export function AiPending({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
        <Sparkles className="h-5 w-5" />
      </span>
      <p className="text-sm font-medium text-foreground">AI 分析即将上线</p>
      <p className="text-xs text-subtle">{label}</p>
    </div>
  );
}

/** 汇总导出的小工具：情绪点图例 */
export function EmotionLegend() {
  const items: [EmotionKind, string][] = [
    ["happy", "喜悦"],
    ["hope", "希望"],
    ["tense", "紧绷"],
    ["sad", "低落"],
  ];
  return (
    <div className="flex flex-wrap gap-3">
      {items.map(([kind, label]) => (
        <span key={kind} className="flex items-center gap-1.5 text-xs text-muted">
          <span className={cn("h-2.5 w-2.5 rounded-full")} style={{ background: EMOTION_COLOR[kind] }} />
          {label}
        </span>
      ))}
    </div>
  );
}
