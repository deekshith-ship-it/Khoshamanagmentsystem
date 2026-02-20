const express = require('express');
const router = express.Router();
const { db } = require('../config/db');

// GET all employees
router.get('/', async (req, res) => {
    try {
        const result = await db.execute('SELECT * FROM employees ORDER BY created_at DESC');
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching employees:', error);
        res.status(500).json({ error: 'Failed to fetch employees' });
    }
});

// GET single employee
router.get('/:id', async (req, res) => {
    try {
        const result = await db.execute({
            sql: 'SELECT * FROM employees WHERE id = ?',
            args: [req.params.id]
        });
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Employee not found' });
        }
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error fetching employee:', error);
        res.status(500).json({ error: 'Failed to fetch employee' });
    }
});

// CREATE employee
router.post('/', async (req, res) => {
    try {
        const {
            employeeName, employeeAddress, employeeNumber, employeeEmail,
            employeeDOB, employeeDesignation, employeeDepartment, employeeJoinDate,
            bankName, bankAccountNumber, ifscCode, panNumber, aadharNumber,
            emergencyContactName, emergencyContactRelationship, emergencyPhone
        } = req.body;

        const result = await db.execute({
            sql: `INSERT INTO employees (
                employee_name, employee_address, employee_number, employee_email, 
                employee_dob, employee_designation, employee_department, employee_join_date,
                bank_name, bank_account_number, ifsc_code, pan_number, aadhar_number,
                emergency_contact_name, emergency_contact_relationship, emergency_contact_phone,
                status, created_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', datetime("now"), datetime("now")) RETURNING *`,
            args: [
                employeeName, employeeAddress, employeeNumber, employeeEmail,
                employeeDOB, employeeDesignation, employeeDepartment, employeeJoinDate,
                bankName, bankAccountNumber, ifscCode, panNumber, aadharNumber,
                emergencyContactName, emergencyContactRelationship, emergencyPhone
            ]
        });
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error creating employee:', error);
        if (error.message && error.message.includes('UNIQUE constraint failed')) {
            return res.status(400).json({ error: 'Employee number already exists' });
        }
        res.status(500).json({ error: 'Failed to create employee' });
    }
});

// UPDATE employee
router.put('/:id', async (req, res) => {
    try {
        const {
            employeeName, employeeAddress, employeeNumber, employeeEmail,
            employeeDOB, employeeDesignation, employeeDepartment, employeeJoinDate,
            bankName, bankAccountNumber, ifscCode, panNumber, aadharNumber,
            emergencyContactName, emergencyContactRelationship, emergencyPhone, status
        } = req.body;

        const result = await db.execute({
            sql: `UPDATE employees SET 
                employee_name = ?, employee_address = ?, employee_number = ?, employee_email = ?, 
                employee_dob = ?, employee_designation = ?, employee_department = ?, employee_join_date = ?,
                bank_name = ?, bank_account_number = ?, ifsc_code = ?, pan_number = ?, aadhar_number = ?,
                emergency_contact_name = ?, emergency_contact_relationship = ?, emergency_contact_phone = ?,
                status = ?, updated_at = datetime("now")
                WHERE id = ? RETURNING *`,
            args: [
                employeeName, employeeAddress, employeeNumber, employeeEmail,
                employeeDOB, employeeDesignation, employeeDepartment, employeeJoinDate,
                bankName, bankAccountNumber, ifscCode, panNumber, aadharNumber,
                emergencyContactName, emergencyContactRelationship, emergencyPhone,
                status, req.params.id
            ]
        });
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Employee not found' });
        }
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error updating employee:', error);
        res.status(500).json({ error: 'Failed to update employee' });
    }
});

// DELETE employee
router.delete('/:id', async (req, res) => {
    try {
        await db.execute({
            sql: 'DELETE FROM employees WHERE id = ?',
            args: [req.params.id]
        });
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting employee:', error);
        res.status(500).json({ error: 'Failed to delete employee' });
    }
});

module.exports = router;
