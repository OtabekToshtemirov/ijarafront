'use client';

import { useForm } from 'react-hook-form';
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useRouter } from 'next/navigation';
import { updateExpense, selectExpenseById } from '@/lib/features/expenses/expensesSlice';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";

export default function ExpenseEditPage({ params }) {
    const dispatch = useDispatch();
    const router = useRouter();
    const expense = useSelector(state => selectExpenseById(state, params.id));

    const form = useForm({
        defaultValues: {
            title: '',
            description: '', 
            amount: 0,
            category: '',
            paymentMethod: '',
            notes: '',
            date: new Date().toISOString().split('T')[0],
        },
        mode: 'onChange',
    });

    const categories = ['maosh', 'elektr', 'suv', 'transport', 'boshqa'];
    const paymentMethods = ['naqd', 'karta'];

    useEffect(() => {
        if (expense) {
            form.reset({
                ...expense,
                date: new Date(expense.date).toISOString().split('T')[0],
            });
        }
    }, [expense, form]);

    const onSubmit = async (values) => {
        try {
            await dispatch(updateExpense({
                id: params.id,
                changes: {
                    ...values,
                    amount: parseFloat(values.amount),
                    date: new Date(values.date).toISOString(),
                }
            })).unwrap();
            router.push('/expenses');
        } catch (error) {
            console.error('Failed to update expense:', error);
        }
    };

    if (!expense) {
        return <div>Юкланмоқда...</div>;
    }

    return (
        <div className="container mx-auto py-10">
            <Card>
                <CardHeader>
                    <CardTitle>Харажатни таҳрирлаш</CardTitle>
                </CardHeader>
                <CardContent>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <FormField
                                    control={form.control}
                                    name="title"
                                    rules={{ required: 'Сарлавҳа талаб қилинади' }}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Сарлавҳа</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Харажат сарлавҳаси" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="amount"
                                    rules={{ 
                                        required: 'Сумма талаб қилинади', 
                                        min: { value: 0.01, message: 'Сумма 0 дан катта бўлиши керак' } 
                                    }}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Сумма</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="number"
                                                    placeholder="Сумма"
                                                    {...field}
                                                    onChange={(e) => field.onChange(parseFloat(e.target.value))}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="category"
                                    rules={{ required: 'Категория талаб қилинади' }}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Категория</FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value || ''}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Категорияни танланг" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {categories.map((cat) => (
                                                        <SelectItem key={cat} value={cat}>
                                                            {cat}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="paymentMethod"
                                    rules={{ required: 'Тўлов усули талаб қилинади' }}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Тўлов усули</FormLabel>
                                            <Select onValueChange={field.onChange} value={field.value || ''}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Тўлов усулини танланг" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {paymentMethods.map((method) => (
                                                        <SelectItem key={method} value={method}>
                                                            {method}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="date"
                                    rules={{ required: 'Сана талаб қилинади' }}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Сана</FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="date"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                            <FormField
                                control={form.control}
                                name="description"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Тавсиф</FormLabel>
                                        <FormControl>
                                            <Textarea placeholder="Тавсиф" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="notes"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Қўшимча изоҳлар</FormLabel>
                                        <FormControl>
                                            <Textarea placeholder="Қўшимча изоҳлар" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <div className="flex justify-end space-x-4">
                                <Button variant="outline" type="button" onClick={() => router.push('/expenses')}>
                                    Бекор қилиш
                                </Button>
                                <Button type="submit">Харажатни янгилаш</Button>
                            </div>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    );
}