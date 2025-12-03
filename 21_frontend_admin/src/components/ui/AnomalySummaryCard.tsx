import { LucideIcon } from 'lucide-react';

interface AnomalySummaryCardProps {
    title: string;
    value: string;
    icon: LucideIcon;
    iconColor: string;
    iconBgColor: string;
}

export function AnomalySummaryCard({ title, value, icon: Icon, iconColor, iconBgColor }: AnomalySummaryCardProps) {
    return (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 flex items-center justify-between">
            <div>
                <p className="text-sm font-medium text-gray-500">{title}</p>
                <h3 className="text-2xl font-bold text-gray-800 mt-1">{value}</h3>
            </div>
            <div className={`p-3 rounded-full ${iconBgColor}`}>
                <Icon className={`w-6 h-6 ${iconColor}`} />
            </div>
        </div>
    );
}
