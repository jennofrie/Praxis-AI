"use client";

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

export function ActivityChart() {
  const options = {
    responsive: true,
    maintainAspectRatio: false,
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
          font: {
            size: 12,
            family: "'Inter', sans-serif",
          },
        },
      },
      tooltip: {
        backgroundColor: "rgba(15, 23, 42, 0.9)", // slate-900
        titleColor: "#f8fafc", // slate-50
        bodyColor: "#e2e8f0", // slate-200
        padding: 12,
        cornerRadius: 8,
        displayColors: true,
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
          drawBorder: false,
        },
        ticks: {
          font: {
            size: 11,
            family: "'Inter', sans-serif",
          },
          color: "#64748b", // slate-500
        },
      },
      y: {
        type: "linear" as const,
        display: true,
        position: "left" as const,
        grid: {
          color: "rgba(226, 232, 240, 0.6)", // slate-200 with opacity
          drawBorder: false,
          borderDash: [4, 4],
        },
        ticks: {
          font: {
            size: 11,
            family: "'Inter', sans-serif",
          },
          color: "#64748b", // slate-500
          stepSize: 20,
        },
        title: {
          display: false,
        },
      },
      y1: {
        type: "linear" as const,
        display: true,
        position: "right" as const,
        grid: {
          drawOnChartArea: false, // only want the grid lines for one axis to show up
        },
        ticks: {
          font: {
            size: 11,
            family: "'Inter', sans-serif",
          },
          color: "#6366f1", // indigo-500
        },
      },
    },
  };

  const labels = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  const data = {
    labels,
    datasets: [
      {
        label: "Active Sessions",
        data: [45, 52, 38, 65, 58, 24, 30],
        borderColor: "#0ea5e9", // sky-500
        backgroundColor: "rgba(14, 165, 233, 0.1)",
        tension: 0.4,
        fill: true,
        yAxisID: "y",
      },
      {
        label: "AI Processing Queue",
        data: [12, 19, 15, 28, 22, 8, 10],
        borderColor: "#6366f1", // indigo-500
        backgroundColor: "rgba(99, 102, 241, 0.1)",
        borderDash: [5, 5],
        tension: 0.4,
        fill: false,
        yAxisID: "y1",
      },
    ],
  };

  return <Line options={options} data={data} />;
}
