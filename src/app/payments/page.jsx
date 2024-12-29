'use client'

import { useEffect, useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import { useForm } from "react-hook-form"
import { format, isSameMonth } from "date-fns"
import { CalendarIcon, Loader2 } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Calendar } from "@/components/ui/calendar"
import { useToast } from "@/hooks/use-toast"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormDescription,
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
import { 
  createPayment, 
  fetchPayments, 
  selectPayments,
  selectPaymentsStatus,
  selectAddPaymentStatus,
  selectAddPaymentError
} from "@/lib/features/payments/paymentSlice"
import { fetchCustomers } from "@/lib/features/customers/customerSlice"

export default function PaymentManagement() {
  const dispatch = useDispatch()
  const { toast } = useToast()
  const [showForm, setShowForm] = useState(false)
  const [editingPayment, setEditingPayment] = useState(null)
  const [filteredCustomers, setFilteredCustomers] = useState(null)
  
  const customers = useSelector((state) => state.customers.customers)
  const payments = useSelector(selectPayments)
  const paymentStatus = useSelector(selectPaymentsStatus)
  const addStatus = useSelector(selectAddPaymentStatus)
  const addError = useSelector(selectAddPaymentError)

  const form = useForm({
    defaultValues: {
      customer: "",
      amount: "",
      paymentDate: new Date(),
      paymentType: "cash",
      description: "",
    },
  })

  useEffect(() => {
    dispatch(fetchCustomers())
    dispatch(fetchPayments())
  }, [dispatch])

  useEffect(() => {
    if (addStatus === 'failed' && addError) {
      toast({ 
        title: "Error adding payment", 
        description: addError,
        variant: "destructive" 
      })
    }
  }, [addStatus, addError, toast])

  const onSubmit = async (data) => {
    try {
      if (editingPayment) {
        // Handle edit case
      } else {
        await dispatch(createPayment({
          customer: data.customer,
          amount: parseFloat(data.amount),
          paymentDate: data.paymentDate,
          paymentType: data.paymentType,
          description: data.description
        })).unwrap()
        
        // Refresh payments only after successful creation
        await dispatch(fetchPayments())
        toast({ title: "Payment added successfully!" })
        form.reset()
        setShowForm(false)
      }
    } catch (error) {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to add payment", 
        variant: "destructive" 
      })
    }
  }

  const handleEdit = (payment) => {
    setEditingPayment(payment)
    form.reset({
      customer: payment.customer,
      amount: payment.amount,
      paymentDate: new Date(payment.paymentDate),
      paymentType: payment.paymentType,
      description: payment.description,
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
                                <div className="p-2">
                                  <Input
                                    type="text"
                                    placeholder="Search customer..."
                                    className="mb-2"
                                    onChange={(e) => {
                                      const searchTerm = e.target.value.toLowerCase();
                                      const filtered = customers.filter((customer) =>
                                        customer.name.toLowerCase().includes(searchTerm) ||
                                        customer.phone.toLowerCase().includes(searchTerm)
                                      );
                                      setFilteredCustomers(filtered);
                                    }}
                                  />
                                </div>
                                <div className="max-h-[200px] overflow-y-auto">
                                  {(filteredCustomers || customers).map((customer) => (
                                    <SelectItem key={customer._id} value={customer._id}>
                                      <div className="flex flex-col">
                                        <span>{customer.name}</span>
                                        <span className="text-sm text-muted-foreground">
                                          {customer.phone}
                                        </span>
                                      </div>
                                    </SelectItem>
                                  ))}
                                </div>
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
                      name="paymentType"
                      render={({ field }) => (
                          <FormItem>
                            <FormLabel>Payment Type</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select payment type" />
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
                      name="description"
                      render={({ field }) => (
                          <FormItem>
                            <FormLabel>Description (Optional)</FormLabel>
                            <FormControl>
                              <Input placeholder="Additional information" {...field} />
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
                    <TableHead>Type</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((payment) => (
                      <TableRow key={payment._id}>
                        <TableCell>{customers.find((customer) => customer._id === payment.customer)?.name || "Unknown"}</TableCell>
                        <TableCell>${payment.amount.toLocaleString()}</TableCell>
                        <TableCell>{format(new Date(payment.paymentDate), "PPP")}</TableCell>
                        <TableCell>{payment.paymentType}</TableCell>
                        <TableCell>{payment.description || "-"}</TableCell>
                        <TableCell>
                          <Button onClick={() => handleEdit(payment)} size="sm">
                            <CalendarIcon className="h-4 w-4" />
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