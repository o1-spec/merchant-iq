export function TransactionTable() {
  const transactions = [
    { id: 'TX-1001', customer: 'Sarah Jenkins', amount: '₦45,000', status: 'Completed', date: 'Oct 24, 2:30 PM' },
    { id: 'TX-1002', customer: 'Michael Okoye', amount: '₦12,500', status: 'Completed', date: 'Oct 24, 1:15 PM' },
    { id: 'TX-1003', customer: 'David Smith', amount: '₦150,000', status: 'Pending', date: 'Oct 24, 11:45 AM' },
    { id: 'TX-1004', customer: 'Amaka Chukwu', amount: '₦8,200', status: 'Completed', date: 'Oct 23, 4:20 PM' },
    { id: 'TX-1005', customer: 'Retail Store A', amount: '₦210,000', status: 'Failed', date: 'Oct 23, 9:00 AM' },
  ];

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="p-6 border-b border-border flex justify-between items-center">
        <h2 className="text-lg font-semibold text-foreground">Recent Transactions</h2>
        <button className="text-sm text-primary hover:underline">View All</button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left min-w-[600px]">
          <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border">
            <tr>
              <th className="px-6 py-3 font-medium">Transaction ID</th>
              <th className="px-6 py-3 font-medium">Customer/Entity</th>
              <th className="px-6 py-3 font-medium">Amount</th>
              <th className="px-6 py-3 font-medium">Date</th>
              <th className="px-6 py-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((tx) => (
              <tr key={tx.id} className="bg-card border-b border-border hover:bg-muted/30 transition-colors">
                <td className="px-6 py-4 font-medium text-foreground">{tx.id}</td>
                <td className="px-6 py-4 text-foreground">{tx.customer}</td>
                <td className="px-6 py-4 font-semibold text-foreground">{tx.amount}</td>
                <td className="px-6 py-4 text-muted-foreground">{tx.date}</td>
                <td className="px-6 py-4">
                  <span className={`px-2.5 py-1 text-xs rounded-full font-medium ${
                    tx.status === 'Completed' ? 'bg-primary-light text-primary border border-primary-light/40' :
                    tx.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {tx.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
