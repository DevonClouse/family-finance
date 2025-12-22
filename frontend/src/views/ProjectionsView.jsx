import React from 'react';
import { TrendingUp, Settings, Plus, X } from 'lucide-react';
import { Card, Button, Badge, formatCurrency } from '../components/UI.jsx';
import { SimpleLineChart } from '../components/Charts.jsx';

export default function ProjectionsView({ projectionChartData, bucketAllocations, strategies, setStrategies, projections }) {
    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <Card className="p-6">
                <h2 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                    <TrendingUp className="text-blue-600" size={24} />
                    Net Worth Trajectory
                </h2>
                <SimpleLineChart data={projectionChartData} />
                <div className="mt-4 text-center text-sm text-slate-500">
                    Comparing <strong>Baseline Growth</strong> (Assets Coasting) vs <strong>Projected Growth</strong> (Assets + Contributions)
                </div>
            </Card>

            <div className="grid lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1 space-y-6">
                    <h2 className="text-lg font-semibold flex items-center gap-2"><Settings className="text-slate-500" size={20} /> Configuration</h2>
                    {bucketAllocations.filter(b => b.type === 'invest').map(bucket => {
                        const bucketStrategies = strategies[bucket.id] || [];
                        const totalAllocation = bucketStrategies.reduce((sum, s) => sum + s.allocation, 0);

                        return (
                            <Card key={bucket.id} className="p-4 space-y-4">
                                <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                                    <div><h3 className="font-bold text-slate-900">{bucket.name}</h3></div>
                                    <Badge color={totalAllocation === 100 ? 'green' : 'orange'}>{totalAllocation}%</Badge>
                                </div>

                                <div className="space-y-3">
                                    {bucketStrategies.map((strat, idx) => (
                                        <div key={strat.id} className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-sm space-y-2 relative">
                                            <button
                                                onClick={() => {
                                                    const newStrats = bucketStrategies.filter(s => s.id !== strat.id);
                                                    setStrategies({ ...strategies, [bucket.id]: newStrats });
                                                }}
                                                className="absolute top-2 right-2 text-slate-300 hover:text-red-500"
                                            >
                                                <X size={14} />
                                            </button>

                                            <input
                                                className="bg-transparent font-medium text-slate-900 border-none p-0 w-full focus:ring-0"
                                                value={strat.name}
                                                onChange={(e) => {
                                                    const newStrats = [...bucketStrategies];
                                                    newStrats[idx] = { ...newStrats[idx], name: e.target.value };
                                                    setStrategies({ ...strategies, [bucket.id]: newStrats });
                                                }}
                                            />

                                            <div className="grid grid-cols-2 gap-2">
                                                <div>
                                                    <label className="text-xs text-slate-500">Alloc %</label>
                                                    <input
                                                        type="number"
                                                        className="w-full text-xs border-slate-300 rounded"
                                                        value={strat.allocation}
                                                        onChange={(e) => {
                                                            const newStrats = [...bucketStrategies];
                                                            newStrats[idx] = { ...newStrats[idx], allocation: parseFloat(e.target.value) || 0 };
                                                            setStrategies({ ...strategies, [bucket.id]: newStrats });
                                                        }}
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-xs text-slate-500">Return %</label>
                                                    <input
                                                        type="number"
                                                        className="w-full text-xs border-slate-300 rounded"
                                                        value={strat.returnRate}
                                                        onChange={(e) => {
                                                            const newStrats = [...bucketStrategies];
                                                            newStrats[idx] = { ...newStrats[idx], returnRate: parseFloat(e.target.value) || 0 };
                                                            setStrategies({ ...strategies, [bucket.id]: newStrats });
                                                        }}
                                                    />
                                                </div>
                                            </div>

                                            <button
                                                onClick={() => {
                                                    const newStrats = [...bucketStrategies];
                                                    newStrats[idx] = { ...newStrats[idx], reinvest: !newStrats[idx].reinvest };
                                                    setStrategies({ ...strategies, [bucket.id]: newStrats });
                                                }}
                                                className={`w-full py-1 text-xs rounded border ${strat.reinvest ? 'bg-blue-100 border-blue-200 text-blue-700' : 'bg-white border-slate-200 text-slate-500'}`}
                                            >
                                                {strat.reinvest ? 'Reinvests' : 'Cash Flow'}
                                            </button>
                                        </div>
                                    ))}

                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        className="w-full text-xs mt-2"
                                        onClick={() => {
                                            const newStrats = [...bucketStrategies, {
                                                id: Date.now().toString(), // FIX: Convert ID to string for Pydantic
                                                name: 'New Strategy',
                                                allocation: Math.max(0, 100 - totalAllocation),
                                                returnRate: 5,
                                                reinvest: true
                                            }];
                                            setStrategies({ ...strategies, [bucket.id]: newStrats });
                                        }}
                                    >
                                        <Plus size={14} className="mr-1" /> Add Strategy
                                    </Button>
                                </div>
                            </Card>
                        );
                    })}
                </div>
                <div className="lg:col-span-2 space-y-6">
                    <h2 className="text-lg font-semibold flex items-center gap-2"><TrendingUp className="text-green-600" size={20} /> Milestones</h2>
                    <div className="overflow-x-auto">
                        <div className="flex gap-4 pb-4 min-w-max">
                            {projections && projections.length > 0 ? projections.map((proj) => (
                                <Card key={proj.year} className="w-72 p-5 flex-shrink-0 border-t-4 border-t-blue-500 relative overflow-hidden">
                                    <div className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Year {proj.year}</div>
                                    <div className="mb-4">
                                        <div className="text-2xl font-bold text-slate-900">{formatCurrency(proj.totalValue)}</div>
                                        <div className="text-xs text-slate-500 font-medium">Projected Net Worth</div>
                                    </div>
                                    <div className="mb-4 pt-3 border-t border-slate-100">
                                        <div className="flex justify-between items-end">
                                            <div>
                                                <div className="text-sm font-semibold text-slate-600">{formatCurrency(proj.baselineValue)}</div>
                                                <div className="text-[10px] text-slate-400 uppercase tracking-wide">Base (Coast)</div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-sm font-bold text-green-600">+{formatCurrency(proj.totalValue - proj.baselineValue)}</div>
                                                <div className="text-[10px] text-slate-400 uppercase tracking-wide">From Active Flow</div>
                                            </div>
                                        </div>
                                        <div className="w-full h-1.5 bg-slate-100 rounded-full mt-2 overflow-hidden flex">
                                            <div className="h-full bg-slate-400" style={{ width: `${(proj.baselineValue / proj.totalValue) * 100}%` }}></div>
                                            <div className="h-full bg-green-500" style={{ width: `${((proj.totalValue - proj.baselineValue) / proj.totalValue) * 100}%` }}></div>
                                        </div>
                                    </div>
                                    <div className="space-y-2 pt-2">
                                        {Object.values(proj.buckets).map((b, i) => (
                                            <div key={i} className="flex justify-between text-xs text-slate-600">
                                                <span className="truncate pr-2">{b.name}</span>
                                                <span className="font-medium">{formatCurrency(b.portfolioValue)}</span>
                                            </div>
                                        ))}
                                    </div>
                                </Card>
                            )) : (
                                <div className="text-slate-400 text-sm p-4">No projection data available. Add investment strategies to see growth.</div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}