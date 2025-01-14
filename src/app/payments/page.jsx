  'use client'

import { useEffect, useState } from "react"
import { useDispatch, useSelector } from "react-redux"
import { useForm } from "react-hook-form"
import { format, isSameMonth } from "date-fns"
import { CalendarIcon, Loader2, Pencil, Trash2 } from 'lucide-react'
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
  selectAddPaymentError,
  deletePayment
} from "@/lib/features/payments/paymentSlice"
import { fetchCustomers } from "@/lib/features/customers/customerSlice"

export default function PaymentManagement() {
  const dispatch = useDispatch()
  const { toast } = useToast()
  const [showForm, setShowForm] = useState(false)
  const [editingPayment, setEditingPayment] = useState(null)
  const [filteredCustomers, setFilteredCustomers] = useState(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [paymentToDelete, setPaymentToDelete] = useState(null)
  const [filters, setFilters] = useState({
    type: 'all',
    startDate: null,
    endDate: null
  })
  
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
      memo: "",
    },
  })

  useEffect(() => {
    dispatch(fetchCustomers())
    dispatch(fetchPayments())
  }, [dispatch])

  useEffect(() => {
    if (addStatus === 'failed' && addError) {
      toast({ 
        title: "Тўлов қўшишда хатолик", 
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
          memo: data.memo
        })).unwrap()
        
        // Refresh payments only after successful creation
        await dispatch(fetchPayments())
        toast({ title: "Тўлов муваффақиятли қўшилди!" })
        form.reset()
        setShowForm(false)
      }
    } catch (error) {
      toast({ 
        title: "Хатолик", 
        description: error.message || "Тўлов қўшишда хатолик", 
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
      memo: payment.memo || "",
    })
    setShowForm(true)
  }

  const handleCancel = () => {
    setEditingPayment(null)
    form.reset()
    setShowForm(false)
  }

  const handleDelete = (id) => {
    setPaymentToDelete(id)
    setShowDeleteConfirm(true)
  }

  const confirmDelete = async () => {
    try {
      await dispatch(deletePayment(paymentToDelete)).unwrap()
      await dispatch(fetchPayments())
      toast({ title: "Тўлов муваффақиятли ўчирилди" })
      setShowDeleteConfirm(false)
      setPaymentToDelete(null)
    } catch (error) {
      toast({ 
        title: "Хатолик", 
        description: error.message || "Тўловни ўчиришда хатолик юз берди", 
        variant: "destructive" 
      })
    }
  }

  const cancelDelete = () => {
    setShowDeleteConfirm(false)
    setPaymentToDelete(null)
  }

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return '-';
      }
      return format(date, "PPP");
    } catch (error) {
      return '-';
    }
  };

  const currentMonthPayments = payments.filter(payment => {
    try {
      return isSameMonth(new Date(payment.paymentDate), new Date());
    } catch (error) {
      return false;
    }
  });

  const totalForCurrentMonth = currentMonthPayments.reduce((total, payment) => total + (payment.amount || 0), 0)

  return (
      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">Тўловлар</h1>
        <Button onClick={() => setShowForm(!showForm)} className="mb-6">
          {showForm ? "Формани ёпиш" : "Янги тўлов"}
        </Button>

        {showForm && (
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-4">{editingPayment ? "Тўловни таҳрирлаш" : "Тўлов киритиш"}</h2>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                      control={form.control}
                      name="customer"
                      render={({ field }) => (
                          <FormItem>
                            <FormLabel>Мижозни танланг</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Мижозни танланг" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <div className="p-2">
                                  <Input
                                    type="text"
                                    placeholder="Мижозни қидириш..."
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
                                  {(filteredCustomers || customers).map((customer, index) => (
                                    <SelectItem key={index} value={customer._id}>
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
                            <FormLabel>Сумма</FormLabel>
                            <FormControl>
                              <Input placeholder="0" type="number" step="1" {...field} value={field.value || ''} onChange={(e) => field.onChange(parseFloat(e.target.value) || '')} />
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
                            <FormLabel>Тўлов санаси</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                      variant={"outline"}
                                      className={`w-[240px] pl-3 text-left font-normal ${!field.value && "text-muted-foreground"}`}
                                  >
                                    {field.value ? format(field.value, "PPP") : <span>Санани танланг</span>}
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
                            <FormLabel>Тўлов тури</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Тўлов турини танланг" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="cash">Нақд</SelectItem>
                                <SelectItem value="card">Карта</SelectItem>
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
                            <FormLabel>Изоҳ (ихтиёрий)</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Қўшимча маълумот" 
                                {...field}
                                value={field.value || ""} 
                              />
                            </FormControl>
                            <FormDescription>Тўлов ҳақида қўшимча маълумот</FormDescription>
                            <FormMessage />
                          </FormItem>
                      )}
                  />
                  <Button type="submit" className="w-full">
                    {editingPayment ? "Тўловни янгилаш" : "Тўловни сақлаш"}
                  </Button>
                  {editingPayment && (
                      <Button type="button" variant="outline" className="w-full mt-2" onClick={handleCancel}>
                        Бекор қилиш
                      </Button>
                  )}
                </form>
              </Form>
            </div>
        )}

        <div>
          <h2 className="text-2xl font-bold mb-4">Барча тўловлар</h2>
          
          {/* Filters */}
          <div className="mb-6 space-y-4 sm:space-y-0 sm:flex sm:items-center sm:space-x-4">
            <div className="flex-1 max-w-xs">
              <Select
                value={filters.type}
                onValueChange={(value) => setFilters(prev => ({ ...prev, type: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Тўлов турини танланг" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Барчаси</SelectItem>
                  <SelectItem value="cash">Нақд</SelectItem>
                  <SelectItem value="card">Карта</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1 max-w-xs">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={`w-full justify-start text-left font-normal ${
                      !filters.startDate && "text-muted-foreground"
                    }`}
                  >
                    {filters.startDate ? (
                      format(filters.startDate, "PPP")
                    ) : (
                      <span>Бошланиш санаси</span>
                    )}
                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={filters.startDate}
                    onSelect={(date) =>
                      setFilters((prev) => ({ ...prev, startDate: date }))
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex-1 max-w-xs">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={`w-full justify-start text-left font-normal ${
                      !filters.endDate && "text-muted-foreground"
                    }`}
                  >
                    {filters.endDate ? (
                      format(filters.endDate, "PPP")
                    ) : (
                      <span>Тугаш санаси</span>
                    )}
                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={filters.endDate}
                    onSelect={(date) =>
                      setFilters((prev) => ({ ...prev, endDate: date }))
                    }
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <Button 
              variant="outline"
              onClick={() => setFilters({ type: 'all', startDate: null, endDate: null })}
              className="w-full sm:w-auto"
            >
              Филтерни тозалаш
            </Button>
          </div>

          {paymentStatus === "loading" ? (
              <div className="flex justify-center items-center h-32">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
          ) : payments.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Мижоз</TableHead>
                    <TableHead>Тўлов</TableHead>
                    <TableHead>Сана</TableHead>
                    <TableHead>Тури</TableHead>
                    <TableHead>Изоҳ</TableHead>
                    <TableHead>Олдиндан тўлов</TableHead>
                    <TableHead>Амaллар</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments
                    .filter(payment => {
                      // Filter by payment type
                      if (filters.type !== 'all' && payment.paymentMethod !== filters.type) {
                        return false;
                      }
                      
                      // Filter by date range
                      const paymentDate = new Date(payment.paymentDate);
                      if (filters.startDate && paymentDate < filters.startDate) {
                        return false;
                      }
                      if (filters.endDate) {
                        const endDate = new Date(filters.endDate);
                        endDate.setHours(23, 59, 59, 999);
                        if (paymentDate > endDate) {
                          return false;
                        }
                      }
                      
                      return true;
                    })
                    .map((payment, index) => (
                      <TableRow key={index}>
                        <TableCell>{customers.find((customer) => customer._id === payment.customer)?.name || "Номаълум"}</TableCell>
                        <TableCell>{(payment.amount || 0).toLocaleString()} сўм</TableCell>
                        <TableCell>{formatDate(payment.paymentDate)}</TableCell>
                        <TableCell>{payment.paymentType === "cash" ? "Нақд" : "Карта"}</TableCell>
                        <TableCell>{payment.description || "-"}</TableCell>
                        <TableCell>{payment.isPrepaid ? "Ҳа" : "Йўқ"}</TableCell>
                        <TableCell>
                          <div className="flex justify-end gap-2">
                            <Button 
                              onClick={() => handleEdit(payment)} 
                              size="icon" 
                              variant="ghost"
                              className="h-8 w-8"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button 
                              onClick={() => handleDelete(payment._id)}
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
          ) : (
              <p>Тўловлар топилмади.</p>
          )}
        </div>

        <div className="mt-8">
          <h2 className="text-xl font-bold">
            {filters.startDate || filters.endDate ? (
              `Танланган давр учун жами: ${(payments
                .filter(payment => {
                  const paymentDate = new Date(payment.paymentDate);
                  if (filters.startDate && paymentDate < filters.startDate) {
                    return false;
                  }
                  if (filters.endDate) {
                    const endDate = new Date(filters.endDate);
                    endDate.setHours(23, 59, 59, 999);
                    if (paymentDate > endDate) {
                      return false;
                    }
                  }
                  return true;
                })
                .reduce((total, payment) => total + (payment.amount || 0), 0)
                ).toLocaleString()} сўм`
            ) : (
              `Ушбу ойдаги жами: ${(totalForCurrentMonth || 0).toLocaleString()} сўм`
            )}
          </h2>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold mb-2">Тўловни ўчириш</h3>
              <p className="text-gray-600 mb-4">
                Ушбу тўловни ўчирмоқчимисиз? Бу амални ортга қайтариб бўлмайди.
              </p>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={cancelDelete}
                >
                  Бекор қилиш
                </Button>
                <Button
                  variant="destructive"
                  onClick={confirmDelete}
                >
                  Ўчириш
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
  )
}