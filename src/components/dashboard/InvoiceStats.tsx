
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer 
} from "recharts";

const data = [
  { month: "Jan", paid: 4200, pending: 1000, overdue: 400 },
  { month: "Feb", paid: 3800, pending: 1600, overdue: 200 },
  { month: "Mar", paid: 5000, pending: 900, overdue: 0 },
  { month: "Apr", paid: 4800, pending: 1200, overdue: 300 },
  { month: "May", paid: 6000, pending: 800, overdue: 100 },
  { month: "Jun", paid: 5500, pending: 1000, overdue: 200 },
];

export function InvoiceStats() {
  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          barSize={20}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip formatter={(value) => [`$${value}`, "Amount"]} />
          <Legend />
          <Bar 
            dataKey="paid" 
            name="Paid" 
            stackId="a" 
            fill="#10b981" 
            radius={[0, 0, 0, 0]} 
          />
          <Bar 
            dataKey="pending" 
            name="Pending" 
            stackId="a" 
            fill="#f59e0b" 
            radius={[0, 0, 0, 0]} 
          />
          <Bar 
            dataKey="overdue" 
            name="Overdue" 
            stackId="a" 
            fill="#ef4444" 
            radius={[4, 4, 0, 0]} 
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
