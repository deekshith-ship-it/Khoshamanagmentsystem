import React from 'react';
import { MainLayout } from '../components/layout';
import { Card } from '../components/common';
import { Wallet, ArrowUpRight, CreditCard } from 'lucide-react';

const Billing = () => {
    const transactions = [
        { id: '1', date: 'Oct 12, 2024', amount: '$1,200.00', type: 'Credit', status: 'completed' },
        { id: '2', date: 'Oct 08, 2024', amount: '$450.00', type: 'Debit', status: 'pending' },
        { id: '3', date: 'Oct 05, 2024', amount: '$2,800.00', type: 'Credit', status: 'completed' },
    ];

    return (
        <MainLayout title="Billing">
            <div className="max-w-5xl page-enter">
                {/* Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10 stagger-children">
                    <Card className="flex items-center gap-5">
                        <div className="icon-circle-primary">
                            <Wallet size={22} />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Balance</p>
                            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1 stats-value">$4,450.00</p>
                        </div>
                    </Card>
                    <Card className="flex items-center gap-5">
                        <div className="icon-circle-success">
                            <ArrowUpRight size={22} />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Received</p>
                            <p className="text-2xl font-bold text-success-600 dark:text-success-400 mt-1 stats-value">$4,000.00</p>
                        </div>
                    </Card>
                    <Card className="flex items-center gap-5">
                        <div className="icon-circle-warning">
                            <CreditCard size={22} />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Expenses</p>
                            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1 stats-value">$450.00</p>
                        </div>
                    </Card>
                </div>

                {/* Transaction Table */}
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">Recent Transactions</h2>
                </div>
                <Card padding="none" className="overflow-hidden">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="border-b border-gray-100 dark:border-gray-800">
                                <th className="p-4 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Date</th>
                                <th className="p-4 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Type</th>
                                <th className="p-4 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Amount</th>
                                <th className="p-4 text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {transactions.map((tx) => (
                                <tr key={tx.id} className="border-b border-gray-50 dark:border-gray-800/50 table-row-hover">
                                    <td className="p-4 text-sm font-medium text-gray-900 dark:text-gray-200">{tx.date}</td>
                                    <td className="p-4">
                                        <span className={`text-xs font-bold uppercase tracking-wider ${tx.type === 'Credit' ? 'text-success-600 dark:text-success-400' : 'text-amber-600 dark:text-amber-400'}`}>
                                            {tx.type}
                                        </span>
                                    </td>
                                    <td className="p-4 text-sm font-bold text-gray-900 dark:text-white">{tx.amount}</td>
                                    <td className="p-4">
                                        <span className={`badge ${tx.status === 'completed' ? 'badge-success' : 'badge-warning'}`}>
                                            {tx.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </Card>
            </div>
        </MainLayout>
    );
};

export default Billing;
