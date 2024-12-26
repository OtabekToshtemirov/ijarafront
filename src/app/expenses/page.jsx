'use client';

import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Link from 'next/link';
import { format } from 'date-fns';
import { PlusIcon, PencilIcon, TrashIcon } from 'lucide-react';
import { fetchExpenses, fetchExpenseStats, deleteExpense } from '@/lib/features/expenses/expensesSlice';
import { Button } from '@/components/ui/button';
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default function ExpensesPage() {
    const dispatch = useDispatch();
    const { items = [], loading = false, stats = null } = useSelector((state) => state.expenses || {});
    const [filters, setFilters] = useState({
        startDate: '',
        endDate: '',
        category: '',
        paymentMethod: ''
    });

    useEffect(() => {
        dispatch(fetchExpenses(filters));
        dispatch(fetchExpenseStats(filters));
    }, [dispatch, filters]);

    const handleDelete = async (id) => {
        if (window.confirm('Aniq o\'chirishni xohlaysizmi?')) {
            await dispatch(deleteExpense(id));
            dispatch(fetchExpenseStats(filters));
        }
    };

    const categories = ['maosh', 'elektr', 'suv', 'transport', 'boshqa'];
    const paymentMethods = ['naqd', 'karta'];

    return (
        <div className="container mx-auto py-10">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Expenses Management</h1>
                <Link href="/expenses/add">
                    <Button>
                        <PlusIcon className="mr-2 h-4 w-4" /> Add Expense
                    </Button>
                </Link>
            </div>

            <Card className="mb-6">
                <CardHeader>
                    <CardTitle>Filters</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <Input
                            type="date"
                            value={filters.startDate}
                            onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                            placeholder="Start Date"
                        />
                        <Input
                            type="date"
                            value={filters.endDate}
                            onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                            placeholder="End Date"
                        />
                        <Select
                            value={filters.category}
                            onValueChange={(value) => setFilters({ ...filters, category: value })}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent>
                                {categories.map((cat) => (
                                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Select
                            value={filters.paymentMethod}
                            onValueChange={(value) => setFilters({ ...filters, paymentMethod: value })}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select payment method" />
                            </SelectTrigger>
                            <SelectContent>
                                {paymentMethods.map((method) => (
                                    <SelectItem key={method} value={method}>{method}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </CardContent>
            </Card>

            {stats && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Total Expenses</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-bold">${stats.overall?.totalExpenses.toFixed(2) || '0.00'}</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>Total Transactions</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-bold">{stats.overall?.totalCount || 0}</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle>Average Expense</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-2xl font-bold">${stats.overall?.avgExpense.toFixed(2) || '0.00'}</p>
                        </CardContent>
                    </Card>
                </div>
            )}

            <Card>
                <CardHeader>
                    <CardTitle>Expenses List</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Title</TableHead>
                                <TableHead>Category</TableHead>
                                <TableHead>Amount</TableHead>
                                <TableHead>Payment Method</TableHead>
                                <TableHead>Date</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {items.map((expense) => (
                                expense ? (
                                    <TableRow key={expense._id}>
                                        <TableCell>{expense.title}</TableCell>
                                        <TableCell>
                                            <Badge variant="secondary">{expense.category}</Badge>
                                        </TableCell>
                                        <TableCell>${expense.amount.toFixed(2)}</TableCell>
                                        <TableCell>{expense.paymentMethod}</TableCell>
                                        <TableCell>
                                            {format(new Date(expense.date), 'MMM dd, yyyy')}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex space-x-2">
                                                <Link href={`/expenses/edit/${expense._id}`}>
                                                    <Button size="sm" variant="outline">
                                                        <PencilIcon className="h-4 w-4 mr-1" /> Edit
                                                    </Button>
                                                </Link>
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleDelete(expense._id)}
                                                >
                                                    <TrashIcon className="h-4 w-4 mr-1" /> Delete
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ) : null
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
