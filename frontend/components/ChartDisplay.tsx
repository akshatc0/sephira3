import Image from "next/image";

interface ChartDisplayProps {
  base64Image: string;
}

export default function ChartDisplay({ base64Image }: ChartDisplayProps) {
  return (
    <div className="w-full overflow-hidden bg-background-card-bottom/50 border border-white/10 rounded-2xl backdrop-blur-sm shadow-xl mt-4">
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-white/5">
        <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50"></div>
            <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50"></div>
        </div>
        <span className="text-xs font-medium text-text-secondary uppercase tracking-wider">Data Visualization</span>
      </div>
      <div className="p-1">
        <img
            src={`data:image/png;base64,${base64Image}`}
            alt="Generated chart"
            className="w-full h-auto rounded-xl shadow-lg"
        />
      </div>
    </div>
  );
}
