interface ConsumptionItemProps {
    name: string;
    amount: string;
    percent: string;
}

export function ConsumptionItem({ name, amount, percent }: ConsumptionItemProps) {
    return (
        <div className="flex items-center justify-between">
            <span className="text-gray-600">{name}</span>
            <div className="flex items-center gap-4">
                <div className="w-32 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500" style={{ width: percent }}></div>
                </div>
                <span className="text-sm font-medium text-gray-800">{amount}</span>
            </div>
        </div>
    );
}
