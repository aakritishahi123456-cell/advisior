export function QuickActions() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <button className="p-4 bg-blue-50 rounded-lg hover:bg-blue-100 text-left">
        <span className="font-medium text-blue-700">Calculate Loan EMI</span>
      </button>
      <button className="p-4 bg-green-50 rounded-lg hover:bg-green-100 text-left">
        <span className="font-medium text-green-700">Analyze Company</span>
      </button>
      <button className="p-4 bg-purple-50 rounded-lg hover:bg-purple-100 text-left">
        <span className="font-medium text-purple-700">Get Recommendations</span>
      </button>
    </div>
  );
}
