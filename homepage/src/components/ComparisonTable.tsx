interface ComparisonData {
  traditional: string[];
  aiPowered: string[];
}

interface ComparisonTableProps {
  headers: {
    traditional: string;
    aiPowered: string;
  };
  data: ComparisonData;
}

export default function ComparisonTable({ headers, data }: ComparisonTableProps) {
  return (
    <div className="overflow-hidden border border-neutral-200 rounded-xl shadow-sm">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-neutral-200">
          <thead className="bg-gradient-to-r from-neutral-50 to-neutral-100">
            <tr>
              <th 
                scope="col" 
                className="px-6 py-5 text-left text-lg font-bold text-neutral-900 tracking-tight sm:px-8"
              >
                {headers.traditional}
              </th>
              <th 
                scope="col" 
                className="px-6 py-5 text-left text-lg font-bold text-neutral-900 tracking-tight sm:px-8"
              >
                {headers.aiPowered}
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-neutral-100">
            {data.traditional.map((traditionalItem, index) => (
              <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-neutral-50/30'}>
                <td className="px-6 py-5 text-base text-neutral-700 sm:px-8 leading-7 font-medium">
                  {traditionalItem}
                </td>
                <td className="px-6 py-5 text-base text-neutral-900 sm:px-8 leading-7 font-semibold">
                  {data.aiPowered[index]}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}