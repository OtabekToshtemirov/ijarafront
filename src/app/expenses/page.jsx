'use client';

import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { format } from 'date-fns';
import { Plus, Pencil, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import {
    fetchExpenses,
    createExpense,
    updateExpense,
    deleteExpense,

    selectExpenses,
    selectExpenseStatus,
    selectExpenseError,
    selectAddExpenseStatus,
    selectAddExpenseError,
    selectUpdateExpenseStatus,
    selectUpdateExpenseError,
    selectDeleteExpenseStatus,
    selectDeleteExpenseError,
} from '@/lib/features/expenses/expensesSlice';

const EXPENSE_CATEGORIES = [
    { value: 'maosh', label: 'Maosh' },
    { value: 'elektr', label: 'Elektr' },
    { value: 'suv', label: 'Suv' },
    { value: 'transport', label: 'Transport' },
    { value: 'boshqa', label: 'Boshqa' },
    { value: 'soliq', label: 'Soliq' },
    { value: 'xaridlar', label: 'Xaridlar' },
    { value: 'tamir', label: 'Ta\'mir' }
];

const PAYMENT_METHODS = [
    { value: 'karta', label: 'Karta' },
    { value: 'naqd', label: 'Naqd' }
];

const formSchema = z.object({
    description: z.string().optional(),
    amount: z.string().min(1, 'Xarajat summasini kiriting'),
    category: z.string().min(1, 'Kategoriyani tanlang'),
    paymentMethod: z.string().min(1, 'To\'lov turini tanlang'),
    date: z.string(),
});

const formatDate = (dateString) => {
    try {
        if (!dateString) return '';
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return '';
        return format(date, 'dd.MM.yyyy');
    } catch (error) {
        return '';
    }
};

export default function ExpensesPage() {
    const dispatch = useDispatch();
    const { toast } = useToast();
    const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
    const [editingExpense, setEditingExpense] = useState(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [filters, setFilters] = useState({
        category: 'all',
        paymentMethod: 'all',
        startDate: '',
        endDate: '',
        page: 1
    });

    const expenses = useSelector(state => state.expenses.items);
    const loading = useSelector(state => state.expenses.loading);
    const error = useSelector(state => state.expenses.error);
    const totalAmount = useSelector(state => state.expenses.totalAmount);
    const currentPage = useSelector(state => state.expenses.currentPage);
    const totalPages = useSelector(state => state.expenses.totalPages);

    const form = useForm({
        resolver: zodResolver(formSchema),
        defaultValues: {
            description: '',
            amount: '',
            category: '',
            paymentMethod: '',
            date: new Date().toISOString().split('T')[0],
        },
    });

    useEffect(() => {
        const { page, ...otherFilters } = filters;
        const filtersChanged = Object.values(otherFilters).some(value => value && value !== 'all');
        if (filtersChanged) {
            setFilters(prev => ({ ...prev, page: 1 }));
        }
    }, [filters.category, filters.paymentMethod, filters.startDate, filters.endDate]);

    useEffect(() => {
        dispatch(fetchExpenses(filters));
    }, [dispatch, filters]);

    const handlePageChange = (newPage) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setFilters(prev => ({ ...prev, page: newPage }));
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    useEffect(() => {
        if (editingExpense) {
            form.reset({
                description: editingExpense.description,
                amount: editingExpense.amount.toString(),
                category: editingExpense.category,
                paymentMethod: editingExpense.paymentMethod,
                date: editingExpense.date.split('T')[0],
            });
        } else {
            form.reset({
                description: '',
                amount: '',
                category: '',
                paymentMethod: '',
                date: new Date().toISOString().split('T')[0],
            });
        }
    }, [editingExpense, form]);

    const handleSubmit = async (data) => {
        try {
            setIsSubmitting(true);
            const expenseData = {
                ...data,
                amount: parseFloat(data.amount) || 0,
                date: new Date(data.date).toISOString()
            };

            if (editingExpense) {
                await dispatch(updateExpense({ 
                    id: editingExpense._id, 
                    data: expenseData 
                })).unwrap();
                toast({
                    title: "Xarajat yangilandi",
                    description: "Xarajat muvaffaqiyatli yangilandi",
                });
            } else {
                await dispatch(createExpense(expenseData)).unwrap();
                toast({
                    title: "Xarajat qo'shildi",
                    description: "Yangi xarajat muvaffaqiyatli qo'shildi",
                });
            }
            setIsAddDialogOpen(false);
            setEditingExpense(null);
            form.reset();
        } catch (error) {
            toast({
                title: "Xatolik yuz berdi",
                description: error.message,
                variant: "destructive",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteExpense = async (id) => {
        if (window.confirm('Xarajatni o\'chirishni xohlaysizmi?')) {
            try {
                await dispatch(deleteExpense(id)).unwrap();
                toast({
                    title: "Xarajat o'chirildi",
                    description: "Xarajat muvaffaqiyatli o'chirildi",
                });
            } catch (error) {
                toast({
                    title: "Xatolik yuz berdi",
                    description: error.message,
                    variant: "destructive",
                });
            }
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    return (
        <div className="container mx-auto py-10">
            <div className="flex flex-col space-y-4">
                <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold tracking-tight">Xarajatlar</h2>
                    <Button onClick={() => setIsAddDialogOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Yangi xarajat
                    </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                    <div>
                        <Label>Kategoriya</Label>
                        <Select
                            value={filters.category}
                            onValueChange={(value) => setFilters(prev => ({ ...prev, category: value }))}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Barcha kategoriyalar" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Barchasi</SelectItem>
                                {EXPENSE_CATEGORIES.map((category) => (
                                    <SelectItem 
                                        key={`filter-category-${category.value}`} 
                                        value={category.value}
                                    >
                                        {category.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div>
                        <Label>To'lov turi</Label>
                        <Select
                            value={filters.paymentMethod}
                            onValueChange={(value) => setFilters(prev => ({ ...prev, paymentMethod: value }))}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Barcha to'lov turlari" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Barchasi</SelectItem>
                                {PAYMENT_METHODS.map((method) => (
                                    <SelectItem 
                                        key={`filter-payment-${method.value}`} 
                                        value={method.value}
                                    >
                                        {method.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div>
                        <Label>Boshlanish sana</Label>
                        <Input
                            type="date"
                            value={filters.startDate}
                            onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                        />
                    </div>

                    <div>
                        <Label>Tugash sana</Label>
                        <Input
                            type="date"
                            value={filters.endDate}
                            onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                        />
                    </div>
                </div>

                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Sana</TableHead>
                                <TableHead>Kategoriya</TableHead>
                                <TableHead>To'lov turi</TableHead>
                                <TableHead>Summa</TableHead>
                                <TableHead>Izoh</TableHead>
                                <TableHead>Yaratilgan vaqt</TableHead>
                                <TableHead className="text-right">Amallar</TableHead>
                            </TableRow>
                        </TableHeader>
                        {loading ? (
                            <TableBody>
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-10">
                                        <div className="flex items-center justify-center">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            </TableBody>
                        ) : expenses.length === 0 ? (
                            <TableBody>
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center py-10">
                                        Harajatlar topilmadi
                                    </TableCell>
                                </TableRow>
                            </TableBody>
                        ) : (
                            <TableBody>
                                {expenses.map((expense) => (
                                    <TableRow key={expense._id}>
                                        <TableCell>
                                            {formatDate(expense.date)}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="secondary">
                                                {EXPENSE_CATEGORIES.find(c => c.value === expense.category)?.label}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline">
                                                {PAYMENT_METHODS.find(m => m.value === expense.paymentMethod)?.label}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {(parseFloat(expense.amount) || 0).toLocaleString()} so'm
                                        </TableCell>
                                        <TableCell>{expense.description}</TableCell>
                                        <TableCell>
                                            {expense.createdAt ? new Date(expense.createdAt).toLocaleString('uz-UZ', {
                                                year: 'numeric',
                                                month: '2-digit',
                                                day: '2-digit',
                                                hour: '2-digit',
                                                minute: '2-digit',
                                                hour12: false
                                            }) : '-'}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => {
                                                        setEditingExpense(expense);
                                                        setIsAddDialogOpen(true);
                                                    }}
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleDeleteExpense(expense._id)}
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        )}
                    </Table>
                </div>

                <div className="mt-4 flex items-center justify-between">
                    <div className="text-sm text-muted-foreground">
                        Jami xarajatlar: <span className="font-medium">{(totalAmount || 0).toLocaleString()} so'm</span>
                    </div>

                    <div className="flex items-center space-x-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={loading || currentPage <= 1}
                        >
                            Oldingi
                        </Button>
                        <div className="text-sm text-muted-foreground">
                            Sahifa {currentPage} / {Math.max(1, totalPages)}
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={loading || currentPage >= totalPages}
                        >
                            Keyingi
                        </Button>
                    </div>
                </div>

                <Dialog 
                    open={isAddDialogOpen || editingExpense !== null} 
                    onOpenChange={(open) => {
                        if (!open) {
                            setIsAddDialogOpen(false);
                            setEditingExpense(null);
                            form.reset();
                        }
                    }}
                >
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>
                                {editingExpense ? 'Xarajatni tahrirlash' : 'Yangi xarajat'}
                            </DialogTitle>
                            <DialogDescription>
                                {editingExpense ? 
                                    'Xarajat ma\'lumotlarini tahrirlang' : 
                                    'Yangi xarajat qo\'shish uchun formani to\'ldiring'
                                }
                            </DialogDescription>
                        </DialogHeader>

                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="description"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Izoh</FormLabel>
                                            <FormControl>
                                                <Input {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="amount"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Summa</FormLabel>
                                            <FormControl>
                                                <Input 
                                                    type="number" 
                                                    placeholder="Xarajat summasini kiriting"
                                                    {...field} 
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="category"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Kategoriya</FormLabel>
                                            <FormControl>
                                                <Select onValueChange={field.onChange} value={field.value}>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Kategoriyani tanlang" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {EXPENSE_CATEGORIES.map((category) => (
                                                            <SelectItem 
                                                                key={`category-${category.value}`} 
                                                                value={category.value}
                                                            >
                                                                {category.label}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="paymentMethod"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>To'lov turi</FormLabel>
                                            <FormControl>
                                                <Select onValueChange={field.onChange} value={field.value}>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="To'lov turini tanlang" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {PAYMENT_METHODS.map((method) => (
                                                            <SelectItem 
                                                                key={`payment-${method.value}`} 
                                                                value={method.value}
                                                            >
                                                                {method.label}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="date"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Sana</FormLabel>
                                            <FormControl>
                                                <Input type="date" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <div className="flex justify-end gap-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => {
                                            setIsAddDialogOpen(false);
                                            setEditingExpense(null);
                                            form.reset();
                                        }}
                                    >
                                        Bekor qilish
                                    </Button>
                                    <Button type="submit" disabled={isSubmitting}>
                                        {isSubmitting && (
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        )}
                                        {editingExpense ? 'Saqlash' : 'Qo\'shish'}
                                    </Button>
                                </div>
                            </form>
                        </Form>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
}
