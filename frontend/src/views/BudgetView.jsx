import React from 'react';
import { Wallet, Plus, Trash2, PieChart, Building, Anchor } from 'lucide-react';
import { Card, Button, Input, Select, formatCurrency, formatPercent } from '../components/UI.jsx';

export default function BudgetView({
    viewMode, totalIncome, incomes, addIncome, updateIncome, removeIncome,
    totalRentalCashFlow, bucketAllocations, unallocated,
    updateBucket, removeBucket, addBucket
}) {
    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <section className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold flex items-center gap-2"><Wallet className="text-blue-500" size={20} /> Income</h2>
                    <div className="text-right">
                        <div className="text-sm text-slate-500">Total {viewMode}</div>
                        <div className={`text-2xl font-bold ${totalIncome < 0 ? 'text-red-600' : 'text-slate-900'}`}>{formatCurrency(totalIncome)}</div>
                    </div>
                </div>
                <div className="grid gap-3">
                    <Card className="p-4 flex flex-col sm:flex-row gap-4 items-center bg-blue-50 border-blue-200">
                        <div className="flex-1">
                            <div className="font-semibold text-blue-900 flex items-center gap-2"><Building size={16} /> Rental Portfolio Cash Flow</div>
                            <div className="text-xs text-blue-700">Auto-calculated from Real Estate tab</div>
                        </div>
                        <div className="text-right sm:text-center w-40">
                            <div className={`font-mono font-bold ${totalRentalCashFlow >= 0 ? 'text-green-700' : 'text-red-600'}`}>
                                {totalRentalCashFlow >= 0 ? '+' : ''}{formatCurrency(totalRentalCashFlow)}
                            </div>
                        </div>
                        <div className="w-full sm:w-auto min-w-[3rem]"></div>
                        <div className="w-8"></div>
                    </Card>

                    {incomes.map((inc) => {
                        const rawAmount = parseFloat(inc.amount) || 0;
                        const monthlyAmount = inc.frequency === 'monthly' ? rawAmount : rawAmount / 12;
                        const normalizedAmount = viewMode === 'monthly' ? monthlyAmount : monthlyAmount * 12;
                        const percent = totalIncome > 0 ? (normalizedAmount / totalIncome) * 100 : 0;
                        return (
                            <Card key={inc.id} className="p-4 flex flex-col sm:flex-row gap-4 items-center">
                                <Input value={inc.name} onChange={(e) => updateIncome(inc.id, 'name', e.target.value)} placeholder="Income Name" className="flex-1" />
                                <Select value={inc.frequency} onChange={(e) => updateIncome(inc.id, 'frequency', e.target.value)} options={[{ label: 'Monthly', value: 'monthly' }, { label: 'Yearly', value: 'yearly' }]} className="w-full sm:w-40" />
                                <Input type="number" prefix="$" value={inc.amount} onChange={(e) => updateIncome(inc.id, 'amount', e.target.value)} className="w-full sm:w-40" />
                                <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded-md whitespace-nowrap">{formatPercent(percent)}</span>
                                <Button variant="danger" size="icon" onClick={() => removeIncome(inc.id)}><Trash2 size={16} /></Button>
                            </Card>
                        );
                    })}
                    <Button variant="outline" className="w-full border-dashed" onClick={addIncome}><Plus size={16} className="mr-2" /> Add Income</Button>
                </div>
            </section>

            <section className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold flex items-center gap-2"><PieChart className="text-purple-500" size={20} /> Buckets</h2>
                    <div className="text-right">
                        <div className="text-sm text-slate-500">Unallocated</div>
                        <div className={`text-xl font-bold ${unallocated < 0 ? 'text-red-600' : 'text-green-600'}`}>{formatCurrency(unallocated)}</div>
                    </div>
                </div>
                <div className="grid gap-3">
                    {bucketAllocations.map((bucket) => (
                        <Card key={bucket.id} className="p-4 relative overflow-hidden">
                            <div className="absolute bottom-0 left-0 h-1 bg-blue-500 transition-all duration-500" style={{ width: `${Math.min(bucket.shareOfTotal, 100)}%` }} />
                            <div className="flex flex-col lg:flex-row gap-4 lg:items-center relative z-10">
                                <div className="flex-1 flex flex-col gap-2">
                                    <Input value={bucket.name} onChange={(e) => updateBucket(bucket.id, 'name', e.target.value)} placeholder="Bucket Name" className="font-medium" />
                                    <div className="flex gap-2">
                                        <button onClick={() => updateBucket(bucket.id, 'type', 'spend')} className={`text-xs px-2 py-1 rounded border ${bucket.type === 'spend' ? 'bg-orange-50 border-orange-200 text-orange-700' : 'bg-white border-slate-200 text-slate-500'}`}>Spend</button>
                                        <button onClick={() => updateBucket(bucket.id, 'type', 'invest')} className={`text-xs px-2 py-1 rounded border ${bucket.type === 'invest' ? 'bg-purple-50 border-purple-200 text-purple-700' : 'bg-white border-slate-200 text-slate-500'}`}>Invest</button>
                                    </div>
                                </div>
                                <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
                                    <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-lg border border-slate-200">
                                        <button onClick={() => updateBucket(bucket.id, 'allocationType', 'flat')} className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${bucket.allocationType === 'flat' ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}>$</button>
                                        <button onClick={() => updateBucket(bucket.id, 'allocationType', 'percent')} className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${bucket.allocationType === 'percent' ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}>%</button>
                                    </div>
                                    <Input type="number" value={bucket.value} onChange={(e) => updateBucket(bucket.id, 'value', e.target.value)} prefix={bucket.allocationType === 'flat' ? '$' : undefined} placeholder={bucket.allocationType === 'percent' ? '%' : '0.00'} className="w-full sm:w-32" />
                                </div>
                                <div className="flex items-center justify-between sm:justify-end gap-6 w-full lg:w-64">
                                    <div className="text-left sm:text-right">
                                        <div className="text-xs text-slate-500 font-medium uppercase tracking-wider">Flow</div>
                                        <div className="text-lg font-bold text-slate-900">{formatCurrency(bucket.calculatedAmount)}</div>
                                    </div>
                                    <button onClick={() => removeBucket(bucket.id)} className="text-slate-400 hover:text-red-500"><Trash2 size={18} /></button>
                                </div>
                            </div>

                            {bucket.type === 'invest' && (
                                <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between relative z-10">
                                    <div className="flex items-center gap-2 text-xs text-slate-500">
                                        <Anchor size={14} />
                                        <span className="font-medium">Current Balance (Base)</span>
                                    </div>
                                    <Input prefix="$" value={bucket.startingBalance} onChange={(e) => updateBucket(bucket.id, 'startingBalance', parseFloat(e.target.value) || 0)} className="w-32 h-8 text-sm" placeholder="0.00" />
                                </div>
                            )}
                        </Card>
                    ))}
                    <Button variant="outline" className="w-full border-dashed" onClick={addBucket}><Plus size={16} className="mr-2" /> Add Bucket</Button>
                </div>
            </section>
        </div>
    );
}