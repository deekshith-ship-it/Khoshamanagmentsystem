import React, { useState } from 'react';
import { MainLayout } from '../components/layout';
import LeadManagementForm from '../components/leads/LeadManagementForm';

const LeadManagementTest = () => {
    const [submittedData, setSubmittedData] = useState(null);

    const handleSubmit = async (data) => {
        // Simulate API call
        return new Promise((resolve) => {
            setTimeout(() => {
                console.log('Form Data Submitted:', data);
                setSubmittedData(data);
                resolve(true);
            }, 1000);
        });
    };

    const handleCancel = () => {
        alert('Form cancelled');
    };

    return (
        <MainLayout title="Lead Management Module">
            <div className="space-y-8 max-w-5xl mx-auto py-8 px-4">
                <div className="bg-primary-50 dark:bg-primary-900/10 border border-primary-100 dark:border-primary-800 p-4 rounded-xl text-sm text-primary-800 dark:text-primary-300">
                    <strong>Developer View:</strong> This page demonstrates the new Lead Management Form module with dynamic conditional logic and validation.
                </div>

                <LeadManagementForm
                    onSubmit={handleSubmit}
                    onCancel={handleCancel}
                />

                {submittedData && (
                    <div className="animate-enter bg-white dark:bg-dark-surface p-6 rounded-2xl border border-emerald-100 dark:border-emerald-800/30 shadow-sm">
                        <h3 className="text-emerald-700 dark:text-emerald-400 font-bold mb-4 flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                            Last Submitted Data Payload
                        </h3>
                        <pre className="bg-gray-50 dark:bg-dark-bg p-4 rounded-xl overflow-x-auto text-xs font-mono text-gray-700 dark:text-gray-300 border border-gray-100 dark:border-dark-border">
                            {JSON.stringify(submittedData, null, 2)}
                        </pre>
                    </div>
                )}
            </div>
        </MainLayout>
    );
};

export default LeadManagementTest;
