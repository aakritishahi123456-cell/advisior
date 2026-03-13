export function DashboardOverview() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
      <p className="text-gray-600">Welcome to FinSathi AI - Your Nepal Financial Decision Support Platform</p>
    </div>
  );
}

export function QuickActions() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <button className="p-4 bg-blue-50 rounded-lg hover:bg-blue-100">
        <span className="font-medium">Calculate Loan EMI</span>
      </button>
      <button className="p-4 bg-green-50 rounded-lg hover:bg-green-100">
        <span className="font-medium">Analyze Company</span>
      </button>
      <button className="p-4 bg-purple-50 rounded-lg hover:bg-purple-100">
        <span className="font-medium">Get Recommendations</span>
      </button>
    </div>
  );
}

export function RecentActivity() {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="font-medium text-gray-900 mb-4">Recent Activity</h3>
      <p className="text-gray-500">No recent activity</p>
    </div>
  );
}

export function MetricsCards() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-sm text-gray-500">Total Investments</p>
        <p className="text-2xl font-bold">NPR 0</p>
      </div>
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-sm text-gray-500">Portfolio Value</p>
        <p className="text-2xl font-bold">NPR 0</p>
      </div>
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-sm text-gray-500">Total Returns</p>
        <p className="text-2xl font-bold">0%</p>
      </div>
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-sm text-gray-500">Reports</p>
        <p className="text-2xl font-bold">0</p>
      </div>
    </div>
  );
}
