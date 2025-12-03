interface CategoryData {
    category: string;
    amount: string;
    count: string;
    ratio: string;
}

interface CategoryTableProps {
    data: CategoryData[];
}

export function CategoryTable({ data }: CategoryTableProps) {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100">
                <h3 className="text-lg font-bold text-gray-800">카테고리 상세</h3>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">카테고리</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">거래액</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">거래 건수</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">비율</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                        {data.map((row, index) => (
                            <tr key={index} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-800 flex items-center">
                                    <span className="w-2 h-2 rounded-full bg-blue-500 mr-2"></span>
                                    {row.category}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 text-right">{row.amount}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 text-right">{row.count}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                    <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
                                        {row.ratio}
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
