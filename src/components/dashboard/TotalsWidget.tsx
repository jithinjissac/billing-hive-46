
import { Card, CardContent } from "@/components/ui/card";
import { ArrowDown, ArrowUp } from "lucide-react";

interface TotalsWidgetProps {
  title: string;
  value: number;
  change: number;
  trend: "up" | "down" | "neutral";
}

export function TotalsWidget({ title, value, change, trend }: TotalsWidgetProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex flex-col space-y-1.5">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <div className="flex items-center justify-between">
            <p className="text-2xl font-bold">{value}</p>
            <div className={`flex items-center ${
              trend === "up" ? "text-emerald-500" : 
              trend === "down" ? "text-rose-500" : 
              "text-gray-500"
            }`}>
              {trend === "up" ? (
                <ArrowUp className="h-4 w-4 mr-1" />
              ) : trend === "down" ? (
                <ArrowDown className="h-4 w-4 mr-1" />
              ) : null}
              <span className="text-sm font-medium">{change}%</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
