// Component logic
"use client";

import {useEffect, useState} from "react";
import {useDispatch} from "react-redux";
import {useForm} from "react-hook-form";
import * as z from "zod";
import {zodResolver} from "@hookform/resolvers/zod";
import {format} from "date-fns";
import {Button} from "@/components/ui/button";
import {Input} from "@/components/ui/input";
import {Textarea} from "@/components/ui/textarea";
import {Calendar} from "@/components/ui/calendar";
import {useToast} from "@/hooks/use-toast";
import {Popover, PopoverContent, PopoverTrigger} from "@/components/ui/popover";
import {
    Form,
    FormField,
    FormControl,
    FormItem,
    FormLabel,
    FormMessage,
    FormDescription,
} from "@/components/ui/form";
import {Command, CommandGroup, CommandItem, CommandEmpty, CommandInput} from "@/components/ui/command";
import {cn} from "@/lib/utils";
import {addPayment} from "@/lib/features/payments/paymentSlice";
import {fetchCustomers} from "@/lib/features/customers/customerSlice";

// Validation schema
const formSchema = z.object({
    userId: z.string().min(1, "Please select a tenant"),
    date: z.date(),
    amount: z.number().min(1, "Amount must be greater than 0"),
    memo: z.string().optional(),
});

export default function PaymentForm() {
    const dispatch = useDispatch();
    const {toast} = useToast();
    const [users, setUsers] = useState([]);
    const form = useForm({
        resolver: zodResolver(formSchema),
        defaultValues: {
            userId: "",
            date: new Date(),
            amount: "",
            memo: "",
        },
    });

    useEffect(() => {
        dispatch(fetchCustomers()).then((result) => {
                if (result.meta.requestStatus === "fulfilled") {
                    setUsers(result.payload);
                }
            }
        );
    }, [
        dispatch,
    ]);

    const onSubmit = async (data) => {
        try {
            const parsedData = {
                ...data,
                amount: parseInt(data.amount * 100),
            };
            await dispatch(addPayment(parsedData)).unwrap();
            toast({title: "Payment added successfully!"});
            form.reset();
        } catch (error) {
            toast({title: "Error", description: error.message, status: "error"});
        }
    };

    return (
        <div className="max-w-2xl mx-auto p-6">
            <h1 className="text-2xl font-bold">Enter a Payment</h1>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                        control={form.control}
                        name="customer"
                        render={({field}) => (
                            <FormItem>
                                <FormLabel>Mijozni tanlang</FormLabel>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <FormControl>
                                            <Button variant="outline"
                                                    className={cn("w-full", !field.value && "text-muted-foreground")}>
                                                {field.value
                                                    ? users.find((user) => user.id === field.value)?.name || "Mijoz topilmadi"
                                                    : "Qidiruv"}
                                            </Button>
                                        </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent>
                                        <Command>
                                            <CommandInput placeholder="Qidiruv..."/>
                                            <CommandEmpty>No tenant found.</CommandEmpty>
                                            <CommandGroup>
                                                {users.map((user, index) => (
                                                    <CommandItem
                                                        key={user.id || `user-${index}`} // Ensure a unique key
                                                        onSelect={() => field.onChange(user.id)}
                                                    >
                                                        {user.name}
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>

                                        </Command>
                                    </PopoverContent>
                                </Popover>
                                <FormMessage/>
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="paymentDate"
                        render={({field}) => (
                            <FormItem>
                                <FormLabel>Date</FormLabel>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <FormControl>
                                            <Button variant="outline" className="w-full">
                                                {field.value ? format(field.value, "PPP") : "Sanani tanlang"}
                                            </Button>
                                        </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent>
                                        <Calendar mode="single" selected={field.value} onSelect={field.onChange}/>
                                    </PopoverContent>
                                </Popover>
                                <FormMessage/>
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="amount"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Amount</FormLabel>
                                <FormControl>
                                    <Input
                                        placeholder="$0.00"
                                        type="number"
                                        step="0.01"
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="memo"
                        render={({field}) => (
                            <FormItem>
                                <FormLabel>Memo (Optional)</FormLabel>
                                <FormControl>
                                    <Textarea placeholder="Qo'shimcha ma'lumot" {...field} />
                                </FormControl>
                                <FormDescription>Add additional notes about this payment.</FormDescription>
                                <FormMessage/>
                            </FormItem>
                        )}
                    />
                    <Button type="submit" className="w-full">
                        Yuborish
                    </Button>
                </form>
            </Form>
        </div>
    );
}