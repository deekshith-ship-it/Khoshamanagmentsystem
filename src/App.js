import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import {
    Dashboard,
    Leads,
    LeadDetails,
    Proposals,
    ProposalDetails,
    Projects,
    ProjectDetails,
    Infra,
    AddInfra,
    InfraDetails,
    GeneralTasks,
    AddTask,
    TaskDetails,
    Links,
    Team,
    Onboarding,
    Billing,
    Contracts,
    Settings,
    Login,
    LeadManagementTest
} from './pages';
import './index.css';
import { ThemeProvider } from './context/ThemeContext';

function App() {
    return (
        <ThemeProvider>
            <Router>
                <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/leads" element={<Leads />} />
                    <Route path="/leads/:id" element={<LeadDetails />} />
                    <Route path="/proposals" element={<Proposals />} />
                    <Route path="/proposals/:id" element={<ProposalDetails />} />
                    <Route path="/projects" element={<Projects />} />
                    <Route path="/projects/:id" element={<ProjectDetails />} />
                    <Route path="/infra" element={<Infra />} />
                    <Route path="/infra/add" element={<AddInfra />} />
                    <Route path="/infra/:id" element={<InfraDetails />} />
                    <Route path="/tasks" element={<GeneralTasks />} />
                    <Route path="/tasks/add" element={<AddTask />} />
                    <Route path="/tasks/:id" element={<TaskDetails />} />
                    <Route path="/links" element={<Links />} />
                    <Route path="/team" element={<Team />} />
                    <Route path="/onboarding" element={<Onboarding />} />
                    <Route path="/billing" element={<Billing />} />
                    <Route path="/contracts" element={<Contracts />} />
                    <Route path="/settings" element={<Settings />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/lead-module-test" element={<LeadManagementTest />} />
                </Routes>
            </Router>
        </ThemeProvider>
    );
}

export default App;

