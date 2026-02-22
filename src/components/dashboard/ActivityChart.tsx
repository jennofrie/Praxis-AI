"use client";

import { useRef } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  type ChartData,
  type Plugin,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface Props {
  labels?: string[];
  sessionCounts?: number[];
  isLoading?: boolean;
}

// Gradient fill plugin — creates canvas gradient at render time
const gradientPlugin: Plugin = {
  id: "gradientFill",
  beforeDatasetDraw(chart) {
    const { ctx, chartArea } = chart;
    if (!chartArea) return;

    chart.data.datasets.forEach((dataset: any, i) => {
      if (!dataset._gradientApplied) {
        const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
        if (i === 0) {
          gradient.addColorStop(0, "rgba(14, 165, 233, 0.35)");
          gradient.addColorStop(1, "rgba(14, 165, 233, 0)");
        } else {
          gradient.addColorStop(0, "rgba(99, 102, 241, 0.25)");
          gradient.addColorStop(1, "rgba(99, 102, 241, 0)");
        }
        dataset.backgroundColor = gradient;
        dataset._gradientApplied = true;
      }
    });
  },
};

ChartJS.register(gradientPlugin);

const DEFAULT_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const DEFAULT_COUNTS = [0, 0, 0, 0, 0, 0, 0];

export function ActivityChart({ labels, sessionCounts, isLoading }: Props) {
  const chartRef = useRef(null);

  const chartLabels = labels ?? DEFAULT_LABELS;
  const chartData = sessionCounts ?? DEFAULT_COUNTS;

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    animation: {
      duration: 800,
      easing: "easeInOutQuart" as const,
    },
    interaction: {
      mode: "index" as const,
      intersect: false,
    },
    plugins: {
      legend: {
        position: "top" as const,
        align: "end" as const,
        labels: {
          usePointStyle: true,
          pointStyle: "circle",
          boxWidth: 8,
          boxHeight: 8,
          padding: 20,
          font: { size: 12, family: "'Inter', sans-serif" },
        },
      },
      tooltip: {
        backgroundColor: "rgba(15, 23, 42, 0.9)",
        titleColor: "#f8fafc",
        bodyColor: "#e2e8f0",
        padding: 12,
        cornerRadius: 8,
        displayColors: true,
      },
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: {
          font: { size: 11, family: "'Inter', sans-serif" },
          color: "#64748b",
        },
      },
      y: {
        type: "linear" as const,
        display: true,
        position: "left" as const,
        grid: {
          color: "rgba(226, 232, 240, 0.6)",
          borderDash: [4, 4],
        },
        ticks: {
          font: { size: 11, family: "'Inter', sans-serif" },
          color: "#64748b",
          stepSize: 5,
        },
      },
    },
  };

  const data: ChartData<"line"> = {
    labels: chartLabels,
    datasets: [
      {
        label: "Completed Sessions",
        data: chartData,
        borderColor: "#0ea5e9",
        backgroundColor: "rgba(14, 165, 233, 0.35)", // overridden by gradient plugin
        tension: 0.45,
        fill: true,
        pointRadius: 4,
        pointBorderWidth: 2,
        pointBorderColor: "#0ea5e9",
        pointBackgroundColor: "#fff",
        borderWidth: 2.5,
      },
    ],
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm">Loading chart data…</span>
        </div>
      </div>
    );
  }

  return <Line ref={chartRef} options={options} data={data} />;
}
