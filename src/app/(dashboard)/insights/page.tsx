import { AIInsightCard } from "@/components/dashboard/AIInsightCard";

export default function InsightsPage() {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Financial Insights</h1>
        <p className="text-muted-foreground mt-1">AI-powered analysis and recommendations for your business.</p>
      </div>

      <div className="max-w-2xl">
        <AIInsightCard />
      </div>
    </div>
  );
}
