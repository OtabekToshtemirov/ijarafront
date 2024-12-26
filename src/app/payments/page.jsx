'use client'

import { useEffect, useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import { useForm, Controller } from "react-hook-form"
import { format, isSameMonth } from "date-fns"
import { CalendarIcon, Loader2, Pencil, Check, X } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Calendar } from "@/components/ui/calendar"
import { useToast } from "@/hooks/use-toast"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { addPayment, fetchPayments, editPayment } from "@/lib/features/payments/paymentSlice"
import { fetchCustomers } from "@/lib/features/customers/customerSlice"

export default function PaymentManagement() {
  const dispatch = useDispatch()
  const { toast } = useToast()
  const [showForm, setShowForm] = useState(false)
  const [editingPayment, setEditingPayment] = useState(null)
  const customers = useSelector((state) => state.customers.customers)
  const payments = useSelector((state) => state.payments.payments)
  const paymentStatus = useSelector((state) => state.payments.status)
  const form = useForm({
    defaultValues: {
      customer: "",
      amount: "",
      paymentDate: new Date(),
      paymentMethod: "cash",
      memo: "",
    },
  })

  useEffect(() => {
    dispatch(fetchCustomers())
    dispatch(fetchPayments())
  }, [dispatch])

  const onSubmit = async (data) => {
    try {
      if (editingPayment) {
        await dispatch(editPayment({ _id: editingPayment._id, updatedPayment: data })).unwrap()
        toast({ title: "Payment updated successfully!" })
        setEditingPayment(null)
      } else {
        await dispatch(addPayment(data)).unwrap()
        // refresh payments
        dispatch(fetchPayments())
        toast({ title: "Payment added successfully!" })
      }
      form.reset()
      setShowForm(false)
    } catch (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" })
    }
  }

  const handleEdit = (payment) => {
    setEditingPayment(payment)
    form.reset({
      customer: payment.customer,
      amount: payment.amount,
      paymentDate: new Date(payment.paymentDate),
      paymentMethod: payment.paymentMethod,
      memo: payment.memo,
    })
    setShowForm(true)
  }

  const handleCancel = () => {
    setEditingPayment(null)
    form.reset()
    setShowForm(false)
  }

  const currentMonthPayments = payments.filter(payment => isSameMonth(new Date(payment.paymentDate), new Date()))
  const totalForCurrentMonth = currentMonthPayments.reduce((total, payment) => total + payment.amount, 0)

  return (
      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">Payment Management</h1>
        <Button onClick={() => setShowForm(!showForm)} className="mb-6">
          {showForm ? "Hide Form" : "New Payment"}
        </Button>

        {showForm && (
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-4">{editingPayment ? "Edit Payment" : "Enter a Payment"}</h2>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                      control={form.control}
                      name="customer"
                      render={({ field }) => (
                          <FormItem>
                            <FormLabel>Select Customer</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select customer" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {customers.map((customer) => (
                                    <SelectItem key={customer._id} value={customer._id}>
                                      {customer.name}
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
                      name="amount"
                      render={({ field }) => (
                          <FormItem>
                            <FormLabel>Amount</FormLabel>
                            <FormControl>
                              <Input placeholder="0.00" type="number" step="0.01" {...field} value={field.value || ''} onChange={(e) => field.onChange(parseFloat(e.target.value) || '')} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                      )}
                  />
                  <FormField
                      control={form.control}
                      name="paymentDate"
                      render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>Payment Date</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                      variant={"outline"}
                                      className={`w-[240px] pl-3 text-left font-normal ${!field.value && "text-muted-foreground"}`}
                                  >
                                    {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                    mode="single"
                                    selected={field.value}
                                    onSelect={field.onChange}
                                    disabled={(date) => date > new Date() || date < new Date("1900-01-01")}
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
                      name="paymentMethod"
                      render={({ field }) => (
                          <FormItem>
                            <FormLabel>Payment Method</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select payment method" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="cash">Cash</SelectItem>
                                <SelectItem value="card">Card</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                      )}
                  />
                  <FormField
                      control={form.control}
                      name="memo"
                      render={({ field }) => (
                          <FormItem>
                            <FormLabel>Memo (Optional)</FormLabel>
                            <FormControl>
                              <Textarea placeholder="Additional information" {...field} />
                            </FormControl>
                            <FormDescription>Add additional notes about this payment.</FormDescription>
                            <FormMessage />
                          </FormItem>
                      )}
                  />
                  <Button type="submit" className="w-full">
                    {editingPayment ? "Update Payment" : "Submit Payment"}
                  </Button>
                  {editingPayment && (
                      <Button type="button" variant="outline" className="w-full mt-2" onClick={handleCancel}>
                        Cancel Edit
                      </Button>
                  )}
                </form>
              </Form>
            </div>
        )}

        <div>
          <h2 className="text-2xl font-bold mb-4">All Payments</h2>
          {paymentStatus === "loading" ? (
              <div className="flex justify-center items-center h-32">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
          ) : payments.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Memo</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((payment) => (
                      <TableRow key={payment._id}>
                        <TableCell>{customers.find((customer) => customer._id === payment.customer)?.name || "Unknown"}</TableCell>
                        <TableCell>${payment.amount.toLocaleString()}</TableCell>
                        <TableCell>{format(new Date(payment.paymentDate), "PPP")}</TableCell>
                        <TableCell>{payment.paymentMethod}</TableCell>
                        <TableCell>{payment.memo || "-"}</TableCell>
                        <TableCell>
                          <Button onClick={() => handleEdit(payment)} size="sm">
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                  ))}
                </TableBody>
              </Table>
          ) : (
              <p>No payments found.</p>
          )}
        </div>

        <div className="mt-8">
          <h2 className="text-xl font-bold">Total for this month: ${totalForCurrentMonth.toLocaleString()}</h2>
        </div>
      </div>
  )
}