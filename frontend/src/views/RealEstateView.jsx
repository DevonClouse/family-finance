import React from 'react';
import { Home, Link as LinkIcon, Building, Plus, Trash2, BarChart2 } from 'lucide-react';
import { Card, Button, Input, Select, formatCurrency } from '../components/UI.jsx';
import { PayoffAnalysis } from '../components/Charts.jsx';

export default function RealEstateView({
    homeData, updateHomeData, buckets, viewMode, amortizationData, bucketAllocations,
    rentals, addRental, updateRental, removeRental, setAnalysisItem
}) {
    return (
        <div className="grid lg:grid-cols-2 gap-8 animate-in fade-in duration-500">
            {/* LEFT COLUMN */}
            <div className="space-y-6">
                <Card className="p-6">
                    <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2"><Home className="text-blue-600" size={24} /> Primary Home</h2>
                    <div className="space-y-4">
                        <Input prefix="$" type="number" value={homeData.homeValue} onChange={(e) => updateHomeData('homeValue', parseFloat(e.target.value) || 0)} placeholder="Estimated Home Value" />
                        <div className="grid grid-cols-2 gap-4">
                            <Input prefix="$" type="number" value={homeData.mortgageBalance} onChange={(e) => updateHomeData('mortgageBalance', parseFloat(e.target.value) || 0)} placeholder="Mortgage Bal" />
                            <Input suffix="%" type="number" value={homeData.interestRate} onChange={(e) => updateHomeData('interestRate', parseFloat(e.target.value) || 0)} placeholder="Interest Rate" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div><label className="text-xs text-slate-500 mb-1 block">Term (Years)</label><Select value={homeData.term} onChange={(e) => updateHomeData('term', parseInt(e.target.value))} options={[{ value: 30, label: '30 Years' }, { value: 15, label: '15 Years' }]} /></div>
                            <div><label className="text-xs text-slate-500 mb-1 block">Est. Appreciation</label><Input suffix="%" type="number" value={homeData.appreciationRate} onChange={(e) => updateHomeData('appreciationRate', parseFloat(e.target.value) || 0)} /></div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Monthly Payment (P&I)</label>
                            <Input prefix="$" type="number" value={homeData.monthlyPayment} onChange={(e) => updateHomeData('monthlyPayment', parseFloat(e.target.value) || 0)} placeholder="Monthly Payment" />
                            <p className="text-xs text-slate-500 mt-1">Calculated automatically based on term, rate, and balance.</p>
                        </div>
                    </div>
                </Card>
                <Card className="p-6 bg-green-50 border-green-100">
                    <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2"><LinkIcon className="text-green-600" size={24} /> Extra Principal Link</h2>
                    <Select value={homeData.linkedBucketId} onChange={(e) => updateHomeData('linkedBucketId', parseInt(e.target.value))} options={[{ value: -1, label: '-- None --' }, ...buckets.map(b => ({ value: b.id, label: `${b.name} (${formatCurrency(viewMode === 'monthly' ? b.calculatedAmount : b.calculatedAmount / 12)}/mo)` }))]} />
                </Card>
                <Card className="p-6">
                    <h2 className="text-lg font-bold text-slate-900 mb-6">Payoff Timeline</h2>
                    <PayoffAnalysis amortizationData={amortizationData} monthlyPayment={homeData.monthlyPayment} linkedBucket={bucketAllocations.find(b => b.id === homeData.linkedBucketId)} />
                </Card>
            </div>

            {/* RIGHT COLUMN - RENTALS */}
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold flex items-center gap-2"><Building className="text-purple-600" size={20} /> Rental Portfolio</h2>
                    <Button size="sm" onClick={addRental}><Plus size={16} className="mr-1" /> Add Rental</Button>
                </div>

                {rentals.map((rental) => {
                    const expenses = rental.rent * (rental.expenseRatio / 100);
                    const cashFlow = rental.rent - expenses - rental.monthlyPayment;
                    return (
                        <Card key={rental.id} className="p-6 border-purple-100 relative">
                            <button onClick={() => removeRental(rental.id)} className="absolute top-4 right-4 text-slate-300 hover:text-red-500"><Trash2 size={16} /></button>
                            <Input value={rental.name} onChange={(e) => updateRental(rental.id, 'name', e.target.value)} className="font-bold mb-4" placeholder="Property Name" />
                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div><label className="text-xs text-slate-500">Value</label><Input prefix="$" type="number" value={rental.value} onChange={(e) => updateRental(rental.id, 'value', parseFloat(e.target.value) || 0)} /></div>
                                <div><label className="text-xs text-slate-500">Mortgage</label><Input prefix="$" type="number" value={rental.mortgageBalance} onChange={(e) => updateRental(rental.id, 'mortgageBalance', parseFloat(e.target.value) || 0)} /></div>
                            </div>
                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div><label className="text-xs text-slate-500">Rate (%)</label><Input suffix="%" type="number" value={rental.interestRate} onChange={(e) => updateRental(rental.id, 'interestRate', parseFloat(e.target.value) || 0)} /></div>
                                <div><label className="text-xs text-slate-500">Term (Years)</label><Select value={rental.term} onChange={(e) => updateRental(rental.id, 'term', parseInt(e.target.value))} options={[{ value: 30, label: '30 Years' }, { value: 15, label: '15 Years' }]} /></div>
                            </div>
                            <div className="mb-4">
                                <label className="text-xs text-slate-500">Payment (P&I)</label>
                                <Input prefix="$" type="number" value={rental.monthlyPayment} onChange={(e) => updateRental(rental.id, 'monthlyPayment', parseFloat(e.target.value) || 0)} />
                            </div>
                            <div className="bg-purple-50 p-3 rounded-lg border border-purple-100 mb-4 space-y-3">
                                <div className="flex gap-4">
                                    <div className="flex-1"><label className="text-xs text-purple-800 font-semibold">Est. Monthly Rent</label><Input prefix="$" type="number" value={rental.rent} onChange={(e) => updateRental(rental.id, 'rent', parseFloat(e.target.value) || 0)} className="bg-white" /></div>
                                    <div className="w-24"><label className="text-xs text-purple-800 font-semibold">Exp Ratio</label><Input suffix="%" type="number" value={rental.expenseRatio} onChange={(e) => updateRental(rental.id, 'expenseRatio', parseFloat(e.target.value) || 0)} className="bg-white" /></div>
                                </div>
                                <div className="flex justify-between text-xs text-purple-700 pt-1 border-t border-purple-200">
                                    <span>Expenses (Auto): {formatCurrency(expenses)}</span>
                                    <span className="font-bold">Net Cash Flow: {formatCurrency(cashFlow)}</span>
                                </div>
                            </div>
                            <div className="mb-4">
                                <label className="block text-xs font-medium text-slate-500 mb-1">Bucket Link (Extra Principal)</label>
                                <Select value={rental.linkedBucketId} onChange={(e) => updateRental(rental.id, 'linkedBucketId', parseInt(e.target.value))} options={[{ value: -1, label: '-- None --' }, ...buckets.map(b => ({ value: b.id, label: `${b.name} (${formatCurrency(viewMode === 'monthly' ? b.calculatedAmount : b.calculatedAmount / 12)}/mo)` }))]} />
                            </div>
                            <Button variant="outline" className="w-full" onClick={() => setAnalysisItem(rental)}>
                                <BarChart2 size={16} className="mr-2" /> View Projection
                            </Button>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}