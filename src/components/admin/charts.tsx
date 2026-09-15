"use client";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Tooltip,
  Filler,
  type TooltipItem,
  type ChartOptions,
} from "chart.js";
import { Line, Bar } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Tooltip, Filler);

const LIGHT_GRID = "#D8E0DB";
const DARK_GRID = "#3A3A3A";
const LIGHT_TEXT = "#7C8983";
const DARK_TEXT = "#737373";
const LIGHT_TOOLTIP_BG = "#ffffff";
const DARK_TOOLTIP_BG = "#1E1E1E";
const LIGHT_TOOLTIP_TEXT = "#0C1A14";
const DARK_TOOLTIP_TEXT = "#F5F5F5";

function tooltipBase(isDark: boolean) {
  return {
    backgroundColor: isDark ? DARK_TOOLTIP_BG : LIGHT_TOOLTIP_BG,
    titleColor: isDark ? DARK_TOOLTIP_TEXT : LIGHT_TOOLTIP_TEXT,
    bodyColor: isDark ? DARK_TOOLTIP_TEXT : LIGHT_TOOLTIP_TEXT,
    borderColor: isDark ? DARK_GRID : LIGHT_GRID,
    borderWidth: 1,
    padding: 8,
    cornerRadius: 8,
    displayColors: false,
    titleFont: { size: 11, weight: "bold" as const },
    bodyFont: { size: 11 },
  };
}

/** Trend over time, single series — filled line with real hover tooltips. */
export function TrendLineChart({
  labels,
  values,
  color,
  isDark,
  tooltipLabel,
}: {
  labels: string[];
  values: number[];
  color: string;
  isDark: boolean;
  tooltipLabel?: (index: number, value: number) => string;
}) {
  const grid = isDark ? DARK_GRID : LIGHT_GRID;
  const text = isDark ? DARK_TEXT : LIGHT_TEXT;

  const options: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        ...tooltipBase(isDark),
        callbacks: tooltipLabel
          ? { label: (ctx: TooltipItem<"line">) => tooltipLabel(ctx.dataIndex, ctx.parsed.y ?? 0) }
          : undefined,
      },
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: text, font: { size: 10 } } },
      y: {
        beginAtZero: true,
        grid: { color: grid },
        ticks: { color: text, font: { size: 10 }, precision: 0 },
      },
    },
  };

  return (
    <div style={{ height: 160 }}>
      <Line
        data={{
          labels,
          datasets: [
            {
              data: values,
              borderColor: color,
              backgroundColor: `${color}1A`,
              fill: true,
              tension: 0.35,
              pointRadius: 2,
              pointHoverRadius: 4,
              pointBackgroundColor: color,
              borderWidth: 2,
            },
          ],
        }}
        options={options}
      />
    </div>
  );
}

/** Column chart over time — rounded bars with real hover tooltips. */
export function ColumnBarChart({
  labels,
  values,
  color,
  isDark,
  tooltipLabel,
}: {
  labels: string[];
  values: number[];
  color: string;
  isDark: boolean;
  tooltipLabel?: (index: number, value: number) => string;
}) {
  const grid = isDark ? DARK_GRID : LIGHT_GRID;
  const text = isDark ? DARK_TEXT : LIGHT_TEXT;

  const options: ChartOptions<"bar"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        ...tooltipBase(isDark),
        callbacks: tooltipLabel
          ? { label: (ctx: TooltipItem<"bar">) => tooltipLabel(ctx.dataIndex, ctx.parsed.y ?? 0) }
          : undefined,
      },
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: text, font: { size: 10 } } },
      y: {
        beginAtZero: true,
        grid: { color: grid },
        ticks: { color: text, font: { size: 10 }, precision: 0 },
      },
    },
  };

  return (
    <div style={{ height: 160 }}>
      <Bar
        data={{
          labels,
          datasets: [
            {
              data: values,
              backgroundColor: color,
              borderRadius: 4,
              maxBarThickness: 28,
            },
          ],
        }}
        options={options}
      />
    </div>
  );
}

/** Ranked magnitude across categories — horizontal bars, full-strength color,
 * hover tooltip shows the exact count (replaces the old pale bar-in-track look). */
export function RankedBarChart({
  items,
  color,
  isDark,
  labelFor,
  tooltipLabel,
}: {
  items: { label: string; count: number }[];
  color: string;
  isDark: boolean;
  labelFor: (label: string) => string;
  tooltipLabel?: (index: number, item: { label: string; count: number }) => string;
}) {
  const grid = isDark ? DARK_GRID : LIGHT_GRID;
  const text = isDark ? DARK_TEXT : LIGHT_TEXT;

  const options: ChartOptions<"bar"> = {
    indexAxis: "y" as const,
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        ...tooltipBase(isDark),
        callbacks: tooltipLabel
          ? { label: (ctx: TooltipItem<"bar">) => tooltipLabel(ctx.dataIndex, items[ctx.dataIndex]) }
          : undefined,
      },
    },
    scales: {
      x: {
        beginAtZero: true,
        grid: { color: grid },
        ticks: { color: text, font: { size: 10 }, precision: 0 },
      },
      y: {
        grid: { display: false },
        ticks: { color: text, font: { size: 11 } },
      },
    },
  };

  return (
    <div style={{ height: Math.max(items.length * 32, 60) }}>
      <Bar
        data={{
          labels: items.map((i) => labelFor(i.label)),
          datasets: [
            {
              data: items.map((i) => i.count),
              backgroundColor: color,
              borderRadius: 4,
              maxBarThickness: 18,
            },
          ],
        }}
        options={options}
      />
    </div>
  );
}
