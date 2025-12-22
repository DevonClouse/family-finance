import React, { useMemo } from 'react';
import { Coins } from 'lucide-react';
import { formatCurrency } from './UI.jsx';

// --- Chart Implementations ---

export const SimpleLineChart = ({ data, width = 600, height = 300 }) => {
    if (!data || data.length === 0) return <div className="h-64 flex items-center justify-center text-slate-400">No Data</div>;
    const padding = 40;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;
    const maxX = Math.max(...data.map(d => d.x));
    const maxY = Math.max(...data.map(d => Math.max(d.baseline, d.accelerated)));

    if (maxY === 0) return <div className="h-64 flex items-center justify-center text-slate-400">No Growth Data</div>;

    const getX = (x) => (x / maxX) * chartWidth + padding;
    const getY = (y) => chartHeight - (y / maxY) * chartHeight + padding;

    const baselinePoints = data.map(d => `${getX(d.x)},${getY(d.baseline)}`).join(' ');
    const acceleratedPoints = data.map(d => `${getX(d.x)},${getY(d.accelerated)}`).join(' ');
    const yTicks = [0, maxY / 2, maxY];

    return (
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto bg-slate-50 rounded-xl border border-slate-100">
            {yTicks.map(t => <line key={t} x1={padding} y1={getY(t)} x2={width - padding} y2={getY(t)} stroke="#e2e8f0" strokeDasharray="4" />)}
            <polyline points={baselinePoints} fill="none" stroke="#94a3b8" strokeWidth="2" strokeDasharray="4" />
            <polyline points={acceleratedPoints} fill="none" stroke="#16a34a" strokeWidth="3" />
            <text x={padding} y={padding - 10} fontSize="10" fill="#64748b">{formatCurrency(maxY)}</text>
            <text x={padding} y={height - padding + 20} fontSize="10" fill="#64748b">Year 0</text>
            <text x={width - padding} y={height - padding + 20} fontSize="10" fill="#64748b" textAnchor="end">Year {maxX}</text>
            <g transform={`translate(${width - 150}, ${padding})`}>
                <rect width="10" height="2" y="4" fill="#94a3b8" />
                <text x="15" y="9" fontSize="10" fill="#475569">Baseline (Coast)</text>
                <rect y="15" width="10" height="3" fill="#16a34a" />
                <text x="15" y="24" fontSize="10" fill="#475569">Projected</text>
            </g>
        </svg>
    );
};

export const SimplePieChart = ({ data, size = 150 }) => {
    const total = data.reduce((sum, d) => sum + d.value, 0);
    if (total === 0) return <div className="text-slate-400 text-xs text-center py-8">No Assets</div>;

    let cumulativeAngle = 0;

    const getCoordinatesForPercent = (percent) => {
        const x = Math.cos(2 * Math.PI * percent);
        const y = Math.sin(2 * Math.PI * percent);
        return [x, y];
    };

    const slices = data.map(d => {
        const percent = d.value / total;
        const startAngle = cumulativeAngle;
        const endAngle = cumulativeAngle + percent;
        cumulativeAngle += percent;

        const [startX, startY] = getCoordinatesForPercent(startAngle);
        const [endX, endY] = getCoordinatesForPercent(endAngle);

        const largeArcFlag = percent > 0.5 ? 1 : 0;

        // SVG path magic
        const pathData = [
            `M 0 0`,
            `L ${startX * 50} ${startY * 50}`,
            `A 50 50 0 ${largeArcFlag} 1 ${endX * 50} ${endY * 50}`,
            `Z`
        ].join(' ');

        return <path key={d.label} d={pathData} fill={d.color} />;
    });

    return (
        <svg viewBox="-60 -60 120 120" width={size} height={size} className="transform -rotate-90">
            {slices}
        </svg>
    );
};

export const PayoffAnalysis = ({ amortizationData, monthlyPayment, linkedBucket }) => {
    const stats = useMemo(() => {
        if (!amortizationData.length) return { yearsBaseline: 0, yearsAccelerated: 0, saved: 0 };
        const baseZero = amortizationData.find(d => d.baseline === 0)?.x || amortizationData[amortizationData.length - 1].x;
        const accelZero = amortizationData.find(d => d.accelerated === 0)?.x || amortizationData[amortizationData.length - 1].x;
        const totalPaidBase = baseZero * monthlyPayment;
        let extra = linkedBucket ? linkedBucket.monthlyAmount : 0;
        const totalPaidAccel = accelZero * (monthlyPayment + extra);
        return {
            yearsBaseline: (baseZero / 12).toFixed(1),
            yearsAccelerated: (accelZero / 12).toFixed(1),
            interestSaved: Math.max(0, totalPaidBase - totalPaidAccel)
        };
    }, [amortizationData, monthlyPayment, linkedBucket]);

    return (
        <div className="space-y-6">
            <SimpleLineChart data={amortizationData} />
            <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-slate-50 rounded-lg text-center">
                    <div className="text-xs text-slate-500 uppercase font-semibold">Standard</div>
                    <div className="text-xl font-bold text-slate-700">{stats.yearsBaseline} Yrs</div>
                </div>
                <div className="p-3 bg-green-50 rounded-lg text-center border border-green-100">
                    <div className="text-xs text-green-600 uppercase font-semibold">Accelerated</div>
                    <div className="text-xl font-bold text-green-700">{stats.yearsAccelerated} Yrs</div>
                </div>
            </div>
            {stats.interestSaved > 0 && (
                <div className="p-4 bg-yellow-50 rounded-lg flex items-center gap-3 border border-yellow-100">
                    <Coins className="text-yellow-600" />
                    <div>
                        <div className="font-bold text-slate-900">Interest Saved</div>
                        <div className="text-green-600 font-bold text-lg">{formatCurrency(stats.interestSaved)}</div>
                    </div>
                </div>
            )}
        </div>
    );
};