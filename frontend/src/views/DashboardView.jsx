import React from 'react';
import { Layers, Activity, PieChart, Home, Wallet, ArrowRight } from 'lucide-react';
import { Card, Button, formatCurrency, formatPercent } from '../components/UI.jsx';
import { SimplePieChart } from '../components/Charts.jsx';

export default function DashboardView({ dashboardStats, setActiveTab, viewMode, totalIncome }) {
    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="p-6 bg-gradient-to-br from-blue-500 to-blue-600 text-white border-none shadow-lg">
                    <div className="flex items-center gap-2 opacity-90 mb-1"><Layers size={18} /> <span className="text-sm font-medium">Net Worth</span></div>
                    <div className="text-3xl font-bold">{formatCurrency(dashboardStats.netWorth)}</div>
                    <div className="mt-4 flex justify-between text-xs opacity-80">
                        <span>Assets: {formatCurrency(dashboardStats.totalAssets)}</span>
                        <span>Liab: {formatCurrency(dashboardStats.totalLiabilities)}</span>
                    </div>
                </Card>
                <Card className="p-6">
                    <div className="flex items-center gap-2 text-slate-500 mb-1"><Activity size={18} /> <span className="text-sm font-medium">Monthly Flow</span></div>
                    <div className={`text-3xl font-bold ${dashboardStats.monthlyIncome >= dashboardStats.monthlyBurn ? 'text-green-600' : 'text-red-600'}`}>
                        {dashboardStats.monthlyIncome >= dashboardStats.monthlyBurn ? '+' : ''}{formatCurrency(dashboardStats.monthlyIncome - dashboardStats.monthlyBurn)}
                    </div>
                    <div className="mt-4 flex justify-between text-xs text-slate-500">
                        <span>In: {formatCurrency(dashboardStats.monthlyIncome)}</span>
                        <span>Out: {formatCurrency(dashboardStats.monthlyBurn)}</span>
                    </div>
                </Card>
                <Card className="p-6">
                    <div className="flex items-center gap-2 text-slate-500 mb-1"><PieChart size={18} /> <span className="text-sm font-medium">Savings Rate</span></div>
                    <div className="text-3xl font-bold text-purple-600">
                        {totalIncome > 0
                            ? formatPercent(((totalIncome - dashboardStats.monthlyBurn) / totalIncome) * 100)
                            : '0.0%'}
                    </div>
                    <div className="mt-4 text-xs text-slate-500">Of Total Income</div>
                </Card>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1">
                    <Card className="p-6 h-full flex flex-col items-center justify-center relative">
                        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider absolute top-6 left-6">Asset Allocation</h3>
                        <div className="mt-8">
                            <SimplePieChart data={dashboardStats.pieData} size={180} />
                        </div>
                        <div className="mt-6 w-full space-y-2">
                            {dashboardStats.pieData.map((d) => (
                                <div key={d.label} className="flex items-center justify-between text-sm">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }}></div>
                                        <span className="text-slate-600">{d.label}</span>
                                    </div>
                                    <span className="font-medium text-slate-900">{formatCurrency(d.value)}</span>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>

                <div className="lg:col-span-2">
                    <Card className="p-0 overflow-hidden">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                            <h3 className="font-bold text-slate-900 flex items-center gap-2"><Wallet className="text-slate-400" size={20} /> Accounts & Assets</h3>
                            <Button size="sm" variant="ghost" onClick={() => setActiveTab('budget')}>Manage in Budget</Button>
                        </div>
                        <div className="divide-y divide-slate-100">
                            <div className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600"><Home size={20} /></div>
                                    <div>
                                        <div className="font-bold text-slate-900">Real Estate Equity</div>
                                        <div className="text-xs text-slate-500">Primary + Rentals</div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="font-bold text-slate-900">{formatCurrency(dashboardStats.realEstateEquity)}</div>
                                </div>
                            </div>

                            {dashboardStats.investBuckets.map((bucket, i) => (
                                <div key={bucket.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold`} style={{ backgroundColor: dashboardStats.pieData.find(d => d.label === bucket.name)?.color || '#94a3b8' }}>
                                            {bucket.name.charAt(0)}
                                        </div>
                                        <div>
                                            <div className="font-bold text-slate-900">{bucket.name}</div>
                                            <div className="text-xs text-slate-500">{bucket.allocationType === 'percent' ? `${bucket.value}% Allocation` : `Flat ${formatCurrency(bucket.value)}`}</div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-bold text-slate-900">{formatCurrency(bucket.startingBalance)}</div>
                                        <div className="text-xs text-green-600 flex items-center justify-end gap-1">
                                            <ArrowRight size={10} />
                                            {formatCurrency(viewMode === 'monthly' ? bucket.calculatedAmount : bucket.calculatedAmount / 12)} /mo flow
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}