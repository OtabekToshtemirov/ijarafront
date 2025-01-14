'use client';

import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useRouter } from 'next/navigation';
import { createExpense } from '@/lib/features/expenses/expensesSlice';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

const formSchema = z.object({
    title: z.string().min(1, "Сарлавҳа талаб қилинади"),
    description: z.string().optional(),
    amount: z.number().min(0.01, "Сумма 0 дан катта бўлиши керак"),
    category: z.string().min(1, "Категория талаб қилинади"),
    paymentMethod: z.string().min(1, "Тўлов усули талаб қилинади"),
    notes: z.string().optional(),
    date: z.date()
});

export default function AddExpensePage() {
    const dispatch = useDispatch();
    const router = useRouter();

    const form = useForm({
        resolver: zodResolver(formSchema),
        defaultValues: {
            title: '',
            description: '',
            amount: 0,
            category: '',
            paymentMethod: '',
            notes: '',
            date: new Date()
        }
    });

    const categories = ['maosh','elektr', 'suv', 'transport', 'boshqa'];
    const paymentMethods = ['naqd', 'karta'];

    const onSubmit = async (values) => {
        console.log('Submitting values:', values);
        try {
            await dispatch(createExpense(values)).unwrap();
            router.push('/expenses');
        } catch (error) {
            console.error('Failed to create expense:', error);
        }
    };

    return (
        <div className="container mx-auto py-10">
            <Card>
                <CardHeader>
                    <CardTitle>Янги харажат қўшиш</CardTitle>
                </CardHeader>
                <CardContent>                                                                                           
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <FormField
                                    control={form.control}
                                    name="title"
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
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Сумма</FormLabel>
                                            <FormControl>
                                                <Input type="number" placeholder="Сумма" {...field} onChange={e => field.onChange(parseFloat(e.target.value))} />
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
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Категорияни танланг" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {categories.map((cat) => (
                                                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
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
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Тўлов усули</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Тўлов усулини танланг" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    {paymentMethods.map((method) => (
                                                        <SelectItem key={method} value={method}>{method}</SelectItem>
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
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Сана</FormLabel>
                                            <FormControl>
                                                <Input type="date" {...field} value={field.value.toISOString().split('T')[0]} onChange={e => field.onChange(new Date(e.target.value))} />
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
                                <Button variant="outline" onClick={() => router.push('/expenses')}>
                                    Бекор қилиш
                                </Button>
                                <Button type="submit">Харажат қўшиш</Button>
                            </div>
                        </form>
                    </Form>
                </CardContent>
            </Card>
        </div>
    );
}
