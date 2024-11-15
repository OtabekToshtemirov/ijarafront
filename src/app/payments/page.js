'use client'

import { useState, useEffect } from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon, Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
} from "@/components/ui/command"
import {
    Form,
    FormControl,
    FormDescription,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "/src/hooks/use-toast"
import { useForm } from "react-hook-form"
import * as z from "zod"
import { zodResolver } from "@hookform/resolvers/zod"

// Validation schema
const formSchema = z.object({
    userId: z.string().min(1, "Please select a tenant"),
    date: z.date(),
    amount: z.string().min(1, "Please enter an amount"),
    memo: z.string().optional(),
})

export default function Component() {
    const { toast } = useToast()
    const form = useForm({
        resolver: zodResolver(formSchema),
        defaultValues: {
            userId: "",
            date: new Date(),
            amount: "",
            memo: "",
        },
    })
    const [users, setUsers] = useState([])

    useEffect(() => {
        async function fetchUsers() {
            try {
                const response = await fetch("https://jsonplaceholder.typicode.com/users")
                const data = await response.json()
                console.log(data)
                setUsers(data)
            } catch (error) {
                console.error("Failed to fetch users:", error)
            }
        }
        fetchUsers()
    }, [])

    const onSubmit = async (data) => {
        try {
            const response = await fetch('/api/payments', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    ...data,
                    amount: parseFloat(data.amount),
                    date: format(data.date, 'yyyy-MM-dd'),
                }),
            })

            if (!response.ok) {
                throw new Error('Payment submission failed')
            }

            toast({
                title: "Success",
                description: "Payment has been recorded successfully.",
            })

            form.reset()
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to record payment. Please try again.",
                variant: "destructive",
            })
        }
    }

    return (
        <div className="max-w-2xl mx-auto p-6">
            <div className="mb-6">
                <h1 className="text-2xl font-bold tracking-tight">Enter a payment</h1>
                <p className="text-sm text-muted-foreground">
                    You can also record a payment directly on the tenant's ledger.
                </p>
            </div>

            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                        control={form.control}
                        name="userId"
                        render={({ field }) => (
                            <FormItem className="flex flex-col">
                                <FormLabel>Choose a tenant</FormLabel>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <FormControl>
                                            <Button
                                                variant="outline"
                                                role="combobox"
                                                className={cn(
                                                    "w-full justify-between",
                                                    !field.value && "text-muted-foreground"
                                                )}
                                            >
                                                {field.value
                                                    ? users.find((user) => user.id === field.value)?.name
                                                    : "Search for a tenant"}
                                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                            </Button>
                                        </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-[200px] p-0">
                                        <Command>
                                            <CommandInput placeholder="Search for a tenant..." />
                                            <CommandEmpty>No tenant found.</CommandEmpty>
                                            <CommandGroup>
                                                {users.map((user) => (
                                                    <CommandItem
                                                        key={user.id}
                                                        value={user.id}
                                                        onSelect={() => {
                                                            form.setValue("userId", user.id)
                                                        }}
                                                    >
                                                        <Check
                                                            className={cn(
                                                                "mr-2 h-4 w-4",
                                                                user.id === field.value
                                                                    ? "opacity-100"
                                                                    : "opacity-0"
                                                            )}
                                                        />
                                                        {user.name}
                                                    </CommandItem>
                                                ))}
                                            </CommandGroup>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="date"
                        render={({ field }) => (
                            <FormItem className="flex flex-col">
                                <FormLabel>Date</FormLabel>
                                <Popover>
                                    <PopoverTrigger asChild>
                                        <FormControl>
                                            <Button
                                                variant="outline"
                                                className={cn(
                                                    "w-full pl-3 text-left font-normal",
                                                    !field.value && "text-muted-foreground"
                                                )}
                                            >
                                                {field.value ? (
                                                    format(field.value, "PPP")
                                                ) : (
                                                    <span>Pick a date</span>
                                                )}
                                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                            </Button>
                                        </FormControl>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-auto p-0" align="start">
                                        <Calendar
                                            mode="single"
                                            selected={field.value}
                                            onSelect={field.onChange}
                                            initialFocus
                                        />
                                    </PopoverContent>
                                </Popover>
                                <FormMessage />
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
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Memo (optional)</FormLabel>
                                <FormControl>
                                    <Textarea
                                        placeholder="Enter a note about this payment"
                                        className="resize-none"
                                        {...field}
                                    />
                                </FormControl>
                                <FormDescription>
                                    Add any additional notes about this payment.
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <Button type="submit" className="w-full">
                        Submit Payment
                    </Button>
                </form>
            </Form>
        </div>
    )
}
