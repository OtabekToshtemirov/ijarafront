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
    { value: 'maosh', label: 'Маош' },
    { value: 'elektr', label: 'Электр' },
    { value: 'suv', label: 'Сув' },
    { value: 'transport', label: 'Транспорт' },
    { value: 'boshqa', label: 'Бошқа' },
    { value: 'soliq', label: 'Солиқ' },
    { value: 'xaridlar', label: 'Харидлар' },
    { value: 'tamir', label: 'Таъмир' }
];

const PAYMENT_METHODS = [
    { value: 'karta', label: 'Карта' },
    { value: 'naqd', label: 'Нақд' }
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
                    title: "Харажат янгиланди",
                    description: "Харажат муваффақиятли янгиланди",
                });
            } else {
                await dispatch(createExpense(expenseData)).unwrap();
                toast({
                    title: "Харажат қўшилди",
                    description: "Янги харажат муваффақиятли қўшилди",
                });
            }
            setIsAddDialogOpen(false);
            setEditingExpense(null);
            form.reset();
        } catch (error) {
            toast({
                title: "Хатолик юз берди",
                description: error.message,
                variant: "destructive",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteExpense = async (id) => {
        if (window.confirm('Харажатни ўчиришни хоҳлайсизми?')) {
            try {
                await dispatch(deleteExpense(id)).unwrap();
                toast({
                    title: "Харажат ўчирилди",
                    description: "Харажат муваффақиятли ўчирилди",
                });
            } catch (error) {
                toast({
                    title: "Хатолик юз берди",
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
                    <h2 className="text-2xl font-bold tracking-tight">Харажатлар</h2>
                    <Button onClick={() => setIsAddDialogOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Янги харажат
                    </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                    <div>
                        <Label>Категория</Label>
                        <Select
                            value={filters.category}
                            onValueChange={(value) => setFilters(prev => ({ ...prev, category: value }))}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Барча категориялар" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Барчаси</SelectItem>
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
                        <Label>Тўлов тури</Label>
                        <Select
                            value={filters.paymentMethod}
                            onValueChange={(value) => setFilters(prev => ({ ...prev, paymentMethod: value }))}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Барча тўлов турлари" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Барчаси</SelectItem>
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
                        <Label>Бошланиш сана</Label>
                        <Input
                            type="date"
                            value={filters.startDate}
                            onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                        />
                    </div>

                    <div>
                        <Label>Тугаш сана</Label>
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
                                <TableHead>Сана</TableHead>
                                <TableHead>Категория</TableHead>
                                <TableHead>Тўлов тури</TableHead>
                                <TableHead>Сумма</TableHead>
                                <TableHead>Изоҳ</TableHead>
                                <TableHead>Яратилган вақт</TableHead>
                                <TableHead className="text-right">Амaллар</TableHead>
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
                                        Харажатлар топилмади
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
                                            {(parseFloat(expense.amount) || 0).toLocaleString()} сўм
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
                        Жами харажатлар: <span className="font-medium">{(totalAmount || 0).toLocaleString()} сўм</span>
                    </div>

                    <div className="flex items-center space-x-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePageChange(currentPage - 1)}
                            disabled={loading || currentPage <= 1}
                        >
                            Олдинги
                        </Button>
                        <div className="text-sm text-muted-foreground">
                            Саҳифа {currentPage} / {Math.max(1, totalPages)}
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePageChange(currentPage + 1)}
                            disabled={loading || currentPage >= totalPages}
                        >
                            Кейинги
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
                                {editingExpense ? 'Харажатни таҳрирлаш' : 'Янги харажат'}
                            </DialogTitle>
                            <DialogDescription>
                                {editingExpense ? 
                                    'Харажат маълумотларини таҳрирланг' : 
                                    'Янги харажат қўшиш учун формани тўлдиринг'
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
                                            <FormLabel>Изоҳ</FormLabel>
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
                                            <FormLabel>Сумма</FormLabel>
                                            <FormControl>
                                                <Input 
                                                    type="number" 
                                                    placeholder="Харажат суммасини киритинг"
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
                                            <FormLabel>Категория</FormLabel>
                                            <FormControl>
                                                <Select onValueChange={field.onChange} value={field.value}>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Категорияни танланг" />
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
                                            <FormLabel>Тўлов тури</FormLabel>
                                            <FormControl>
                                                <Select onValueChange={field.onChange} value={field.value}>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Тўлов турини танланг" />
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
                                            <FormLabel>Сана</FormLabel>
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
                                        Бекор қилиш
                                    </Button>
                                    <Button type="submit" disabled={isSubmitting}>
                                        {isSubmitting && (
                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        )}
                                        {editingExpense ? 'Сақлаш' : 'Қўшиш'}
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
