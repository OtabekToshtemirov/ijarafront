'use client';

import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useParams, useRouter } from "next/navigation";
import { Loader2, ArrowLeft } from "lucide-react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { fetchCustomers } from "@/lib/features/customers/customerSlice";
import { 
    fetchRentalsByCustomerId, 
    addReturnedProduct,
    clearReturnStatus,
    fetchRentals,
} from "@/lib/features/rentals/rentalsSlice";
import { 
    fetchPaymentsByCustomerId,
    selectPayments,
    selectPaymentsStatus,
    getAllPaymentsByCustomerId
} from "@/lib/features/payments/paymentSlice";
import { toast } from "sonner";

export default function CustomerDetailsPage() {
    const dispatch = useDispatch();
    const router = useRouter();
    const { id } = useParams();
    
    const customer = useSelector((state) => state.customers.customers.find(c => c._id === id));
    const rentals = useSelector((state) => state.rentals.rentals.filter(r => r.customer?._id === id)) || [];
    const payments = useSelector(selectPayments) || [];
    const status = useSelector((state) => state.customers.status);
    const paymentsStatus = useSelector(selectPaymentsStatus);

    const [returnDialogOpen, setReturnDialogOpen] = useState(false);
    const [selectedRental, setSelectedRental] = useState(null);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [returnQuantity, setReturnQuantity] = useState(1);
    const [returnDate, setReturnDate] = useState(new Date().toISOString().split('T')[0]);

    useEffect(() => {
        if (id) {
            console.log('Fetching data for customer ID:', id);
            // Fetch all required data at once
            dispatch(fetchRentals());
            dispatch(fetchPaymentsByCustomerId(id));
            dispatch(fetchCustomers());
            dispatch(fetchRentalsByCustomerId(id));
        }
    }, [dispatch, id]);

    // Debug payments
    useEffect(() => {
        console.log('Redux Payments State:', payments);
        console.log('Redux Payments Status:', paymentsStatus);
        if (payments.length === 0) {
            console.log('No payments found in Redux store');
        }
    }, [payments, paymentsStatus]);

    // Debug: rentals ma'lumotlarini konsolga chiqarish
    useEffect(() => {
        if (rentals.length > 0) {
            console.log('Rentals:', rentals);
            const returnHistory = getReturnHistory();
            console.log('Return History:', returnHistory);
        }
    }, [rentals]);

    // Calculate total payments
    const totalPayments = payments.reduce((sum, payment) => sum + payment.amount, 0);

    // Calculate total returns cost
    const totalReturnsCost = rentals.reduce((sum, rental) => {
        return sum + (rental.returnedProducts || []).reduce((returnSum, returnedProduct) => 
            returnSum + (returnedProduct.cost || 0), 0);
    }, 0);

    // Get active rentals
    const activeRentals = rentals.filter(rental => rental.status === 'active');

    // Get unreturned products
    const getUnreturnedProducts = () => {
        return activeRentals.flatMap(rental => {
            // Faqat aktiv ijaralardan qaytarilmagan mahsulotlarni olamiz
            return rental.borrowedProducts.filter(borrowedProduct => {
                // Qaytarilgan miqdorni hisoblaymiz
                const returnedQuantity = rental.returnedProducts
                    ?.filter(returnedProduct => returnedProduct.product === borrowedProduct.product)
                    ?.reduce((sum, returnedProduct) => sum + returnedProduct.quantity, 0) || 0;
                
                // Qaytarilmagan miqdor bor bo'lsa, bu mahsulotni ko'rsatamiz
                return returnedQuantity < borrowedProduct.quantity;
            }).map(borrowedProduct => {
                // Qaytarilgan miqdorni hisoblaymiz
                const returnedQuantity = rental.returnedProducts
                    ?.filter(returnedProduct => returnedProduct.product === borrowedProduct.product)
                    ?.reduce((sum, returnedProduct) => sum + returnedProduct.quantity, 0) || 0;
                
                // Qaytarilmagan miqdorni hisoblaymiz
                const remainingQuantity = borrowedProduct.quantity - returnedQuantity;

                return {
                    ...borrowedProduct,
                    rental,
                    remainingQuantity,
                    returnedQuantity
                };
            });
        });
    };

    // Qaytarish tarixi
    const getReturnHistory = () => {
        return rentals.flatMap(rental => {
            return (rental.returnedProducts || []).map((returnedProduct) => {
                // Mahsulotni topamiz
                const borrowedProduct = rental.borrowedProducts.find(
                    bp => bp.product?._id === returnedProduct.product
                );

                // Mahsulot ma'lumotlarini olamiz
                const product = borrowedProduct?.product;

                return {
                    ...returnedProduct,
                    rental,
                    days: returnedProduct.days || 1,
                    startDate: borrowedProduct?.rentDate || rental.workStartDate,
                    dailyRate: returnedProduct.dailyRate || borrowedProduct?.dailyRate || 0,
                    totalCost: returnedProduct.totalCost || 0,
                    discountDays: returnedProduct.discountDays || 0,
                    productName: product?.name || borrowedProduct?.product?.name || 'Noma\'lum mahsulot'
                };
            });
        });
    };

    // Add this function to calculate total discounts
    const getTotalDiscounts = () => {
        if (!customer?.rentals) return 0;
        
        return customer.rentals.reduce((total, rental) => {
            // Get discounts from payments
            const paymentDiscounts = (rental.payments || []).reduce((sum, payment) => 
                sum + (payment.discount || 0), 0);
            
            // Get discounts from returned products
            const returnDiscounts = (rental.returnedProducts || []).reduce((sum, product) => 
                sum + (product.discount || 0), 0);
            
            return total + paymentDiscounts + returnDiscounts;
        }, 0);
    };

  
    const handleReturn = async () => {
        if (!returnQuantity || returnQuantity <= 0) {
            toast.error("Қайтариш миқдорини киритинг!");
            return;
        }

        const remainingQuantity = getRemainingQuantity(selectedRental, selectedProduct);
        if (returnQuantity > remainingQuantity) {
            toast.error("Қайтариш миқдори қолган миқдордан кўп бўлиши мумкин эмас!");
            return;
        }

        try {
            await dispatch(addReturnedProduct({
                rentalId: selectedRental._id,
                productId: selectedProduct.product._id,
                quantity: returnQuantity,
                returnDate: returnDate
            })).unwrap();

            toast.success("Маҳсулот муваффақиятли қайтарилди");
            setReturnDialogOpen(false);
            setSelectedRental(null);
            setSelectedProduct(null);
            setReturnQuantity(1);
            
            // Refresh data
            dispatch(fetchRentalsByCustomerId(id));
        } catch (error) {
            toast.error("Хатолик юз берди");
        }
    };

    if (status === 'loading' || paymentsStatus === 'loading') {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        );
    }

    if (!customer) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <p className="text-muted-foreground">Мижоз топилмади</p>
            </div>
        );
    }

    return (
        <div className="container mx-auto py-10">
            <div className="mb-6">
                <Button variant="ghost" onClick={() => router.back()} className="hover:bg-blue-50">
                    <ArrowLeft className="h-4 w-4 mr-2 text-blue-600" />
                    <span className="text-blue-600">Орқага</span>
                </Button>
            </div>

            <div className="grid gap-6">
                {/* Customer Information */}
                <Card className="border-t-4 border-t-blue-500 shadow-lg dark:bg-gray-800">
                    <CardHeader className="bg-gradient-to-r from-blue-50 to-white dark:from-blue-900/50 dark:to-gray-800">
                        <CardTitle className="text-blue-700 dark:text-blue-300">Мижоз маълумотлари</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid md:grid-cols-3 gap-6">
                            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                                <h3 className="font-medium mb-2 text-blue-700 dark:text-blue-300">Асосий маълумотлар</h3>
                                <div className="space-y-2">
                                    <p className="text-gray-700 dark:text-gray-300"><span className="font-medium">Исм:</span> {customer.name}</p>
                                    <p className="text-gray-700 dark:text-gray-300"><span className="font-medium">Телефон:</span> {customer.phone}</p>
                                    <p className="text-gray-700 dark:text-gray-300"><span className="font-medium">Манзил:</span> {customer.address}</p>
                                    <Badge className={customer.status === 'VIP' ? 'bg-yellow-500 dark:bg-yellow-600' : 'bg-blue-500 dark:bg-blue-600'}>
                                        {customer.status === 'VIP' ? 'VIP' : 'Оддий'}
                                    </Badge>
                                </div>
                            </div>
                            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                                <h3 className="font-medium mb-2 text-green-700 dark:text-green-300">Молиявий маълумотлар</h3>
                                <div className="space-y-2">
                                    <p className="text-gray-700 dark:text-gray-300">
                                        <span className="font-medium">Баланс:</span> 
                                        <span className={(totalPayments - getReturnHistory().reduce((total, item) => total + (item.totalCost || 0), 0)) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                                            {((totalPayments)-getReturnHistory().reduce((total, item) => total + (item.totalCost || 0), 0))+payments.reduce((total, payment) => 
                                                    total + (payment.discount || 0), 0)} сўм
                                        </span>
                                    </p>
                                    <p className="text-gray-700 dark:text-gray-300">
                                        <span className="font-medium">Жами тўловлар:</span>
                                        <span className="text-green-600 dark:text-green-400"> {totalPayments.toLocaleString()} сўм</span>
                                    </p>
                                    <p className="text-gray-700 dark:text-gray-300">
                                        <span className="font-medium">Қайтаришлар:</span>
                                        <span className="text-blue-600 dark:text-blue-400">   {getReturnHistory().reduce((total, item) => 
                                                    total + (item.totalCost || 0), 0).toLocaleString()} сўм</span>
                                        <span className="ml-2 text-orange-600">
                                            (Чегирма: {payments.reduce((total, payment) => 
                                                    total + (payment.discount || 0), 0).toLocaleString()} сўм)
                                        </span>
                                    </p>
                                </div>
                            </div>
                            <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                                <h3 className="font-medium mb-2 text-purple-700 dark:text-purple-300">Статистика</h3>
                                <div className="space-y-2">
                                    <p className="text-gray-700 dark:text-gray-300">
                                        <span className="font-medium">Фаол ижаралар:</span>
                                        <span className="text-purple-600 dark:text-purple-400"> {activeRentals.length} та</span>
                                    </p>
                                    <p className="text-gray-700 dark:text-gray-300">
                                        <span className="font-medium">Жами ижаралар:</span>
                                        <span className="text-purple-600 dark:text-purple-400"> {rentals.length} та</span>
                                    </p>
                                    <p className="text-gray-700 dark:text-gray-300">
                                        <span className="font-medium">Қайтарилмаган маҳсулотлар:</span>
                                        <span className="text-purple-600 dark:text-purple-400"> {getUnreturnedProducts().length} та</span>
                                    </p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Active Rentals */}
                <Card className="border-t-4 border-t-green-500 shadow-lg dark:bg-gray-800">
                    <CardHeader className="bg-gradient-to-r from-green-50 to-white dark:from-green-900/50 dark:to-gray-800">
                        <CardTitle className="text-green-700 dark:text-green-300">Фаол ижаралар</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {activeRentals.length === 0 ? (
                            <div className="text-center py-4 text-muted-foreground dark:text-gray-400">
                                Фаол ижаралар мавжуд эмас
                            </div>
                        ) : (
                            <div className="rounded-md border dark:border-gray-700">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="dark:border-gray-700">
                                            <TableHead className="dark:text-gray-300">Сана</TableHead>
                                            <TableHead className="dark:text-gray-300">Ижара рақами</TableHead>
                                            <TableHead className="dark:text-gray-300">Маҳсулотлар</TableHead>
                                            <TableHead className="dark:text-gray-300">Умумий нарх</TableHead> 
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {activeRentals.map((rental) => (
                                            <TableRow key={rental._id} className="dark:border-gray-700">
                                                <TableCell className="dark:text-gray-300">{new Date(rental.workStartDate || rental.createdAt).toLocaleDateString()}</TableCell>
                                                <TableCell className="dark:text-gray-300">{rental.rentalNumber}</TableCell>
                                                <TableCell className="dark:text-gray-300">
                                                    {rental.borrowedProducts.map((product, index) => (
                                                        <div key={index}>
                                                            {product.product?.name} ({product.quantity} дона)
                                                        </div>
                                                    ))}
                                                </TableCell>
                                                <TableCell className="dark:text-gray-300">{rental.totalCost?.toLocaleString()} сўм</TableCell>
                                              
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Unreturned Products */}
                <Card className="border-t-4 border-t-red-500 shadow-lg dark:bg-gray-800">
                    <CardHeader className="bg-gradient-to-r from-red-50 to-white dark:from-red-900/50 dark:to-gray-800">
                        <CardTitle className="text-red-700 dark:text-red-300">Қайтарилмаган маҳсулотлар</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {getUnreturnedProducts().length === 0 ? (
                            <div className="text-center py-4 text-muted-foreground dark:text-gray-400">
                                Қайтарилмаган маҳсулотлар мавжуд эмас
                            </div>
                        ) : (
                            <div className="rounded-md border dark:border-gray-700">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="dark:border-gray-700">
                                            <TableHead className="dark:text-gray-300">Маҳсулот</TableHead>
                                            <TableHead className="dark:text-gray-300">Ижара санаси</TableHead>
                                            <TableHead className="dark:text-gray-300">Қолган миқдор</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {getUnreturnedProducts().map((product, index) => (
                                            <TableRow key={index} className="dark:border-gray-700">
                                                <TableCell className="dark:text-gray-300">{product.product?.name}</TableCell>
                                                <TableCell className="dark:text-gray-300">
                                                    {new Date(product.rental.workStartDate || product.rental.createdAt).toLocaleDateString()}
                                                </TableCell>
                                                <TableCell className="dark:text-gray-300">{product.remainingQuantity} дона</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* All Rentals History */}
                <Card className="border-t-4 border-t-purple-500 shadow-lg dark:bg-gray-800">
                    <CardHeader className="bg-gradient-to-r from-purple-50 to-white dark:from-purple-900/50 dark:to-gray-800">
                        <CardTitle className="text-purple-700 dark:text-purple-300">Барча ижаралар тарихи</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {rentals.length === 0 ? (
                            <div className="text-center py-4 text-muted-foreground dark:text-gray-400">
                                Ижаралар тарихи мавжуд эмас
                            </div>
                        ) : (
                            <div className="rounded-md border dark:border-gray-700">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="dark:border-gray-700">
                                            <TableHead className="dark:text-gray-300">Сана</TableHead>
                                            <TableHead className="dark:text-gray-300">Маҳсулотлар</TableHead>
                                            <TableHead className="dark:text-gray-300">Умумий нарх</TableHead>
                                            <TableHead className="dark:text-gray-300">Статус</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {rentals.map((rental) => (
                                            <TableRow key={rental._id} className="dark:border-gray-700">
                                                <TableCell className="dark:text-gray-300">
                                                    {new Date(rental.workStartDate || rental.createdAt).toLocaleDateString()}
                                                </TableCell>
                                                <TableCell className="dark:text-gray-300">
                                                    {rental.borrowedProducts.map((product, index) => (
                                                        <div key={index}>
                                                            {product.product?.name} ({product.quantity} дона)
                                                        </div>
                                                    ))}
                                                </TableCell>
                                                <TableCell className="dark:text-gray-300">{rental.totalCost?.toLocaleString()} сўм</TableCell>
                                                <TableCell>
                                                    <Badge 
                                                        variant={rental.status === 'active' ? 'default' : 'secondary'}
                                                        className={rental.status === 'active' ? 'dark:bg-blue-600' : 'dark:bg-gray-600'}
                                                    >
                                                        {rental.status === 'active' ? 'Фаол' : 'Якунланган'}
                                                    </Badge>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                                {/* Add total amount summary */}
                                
                                {/* Add returned products total */}
                                <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
                                    <div className="flex justify-between items-center">
                                        <span className="text-gray-700 font-medium">Қайтаришлар учун ижара суммаси:</span>
                                        <span className="text-lg font-semibold text-green-600">
                                        {rentals.reduce((total, rental) => 
                                                        total + (rental?.totalCost || 0), 0).toLocaleString()} сўм
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Payments History */}
                <Card className="border-t-4 border-t-indigo-500 shadow-lg dark:bg-gray-800">
                    <CardHeader className="bg-gradient-to-r from-indigo-50 to-white dark:from-indigo-900/50 dark:to-gray-800">
                        <CardTitle className="text-indigo-700 dark:text-indigo-300">Тўловлар тарихи</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {payments.length === 0 ? (
                            <div className="text-center py-4 text-muted-foreground dark:text-gray-400">
                                Тўловлар тарихи мавжуд эмас
                            </div>
                        ) : (
                            <div className="rounded-md border dark:border-gray-700">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="dark:border-gray-700">
                                            <TableHead className="dark:text-gray-300">Тўлов санаси</TableHead>
                                            <TableHead className="dark:text-gray-300">Ижара рақами</TableHead>
                                            <TableHead className="dark:text-gray-300">Тўлов тури</TableHead>
                                            <TableHead className="dark:text-gray-300">Тўлов суммаси</TableHead>
                                            <TableHead className="dark:text-gray-300">Чегирма</TableHead>
                                            <TableHead className="dark:text-gray-300">Изоҳ</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {payments.map((payment) => (
                                            <TableRow key={payment._id} className="dark:border-gray-700">
                                                <TableCell className="dark:text-gray-300">
                                                    {new Date(payment.paymentDate).toLocaleDateString()}
                                                </TableCell>
                                                <TableCell className="dark:text-gray-300">
                                                    {payment.rental?.rentalNumber || '-'}
                                                </TableCell>
                                                <TableCell className="dark:text-gray-300">
                                                    {payment.paymentType === 'cash' ? 'Нақд' : 
                                                     payment.paymentType === 'card' ? 'Пластик' : 
                                                     payment.paymentType === 'transfer' ? 'Ўтказма' : '-'}
                                                </TableCell>
                                                <TableCell className="dark:text-gray-300">
                                                    {payment.amount?.toLocaleString()} сўм
                                                </TableCell>
                                                <TableCell className="text-orange-600">
                                                    {payment.discount > 0 ? `${payment.discount?.toLocaleString()} сўм` : '-'}
                                                </TableCell>
                                                <TableCell className="dark:text-gray-300">
                                                    {payment.description || '-'}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                                {payments.length > 0 && (
                                    <div className="mt-4 flex justify-end gap-4">
                                        <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                                            <span className="text-gray-600 mr-3">Жами тўланган:</span>
                                            <span className="text-lg font-semibold text-blue-600">
                                                {payments.reduce((total, payment) => 
                                                    total + (payment.amount || 0), 0).toLocaleString()} сўм
                                            </span>
                                        </div>
                                        <div className="bg-orange-50 p-3 rounded-lg border border-orange-200">
                                            <span className="text-gray-600 mr-3">Жами чегирма:</span>
                                            <span className="text-lg font-semibold text-orange-600">
                                                {payments.reduce((total, payment) => 
                                                    total + (payment.discount || 0), 0).toLocaleString()} сўм
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Qaytarish tarixi */}
                <Card className="mt-8">
                    <CardHeader>
                        <CardTitle>Qaytarish tarixi</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Sana</TableHead>
                                    <TableHead>Ijara №</TableHead>
                                    <TableHead>Mahsulot</TableHead>
                                    <TableHead>Miqdor</TableHead>
                                    <TableHead>Kunlar</TableHead>
                                    <TableHead>Kunlik narx</TableHead>
                                    <TableHead>Summa</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {getReturnHistory().map((returnItem, index) => (
                                    <TableRow key={index}>
                                        <TableCell>
                                            {new Date(returnItem.returnDate).toLocaleDateString()}
                                        </TableCell>
                                        <TableCell>
                                            {returnItem.rental.rentalNumber}
                                        </TableCell>
                                        <TableCell>
                                            {returnItem.product.name}
                                            {returnItem.productCode && (
                                                <div className="text-xs text-muted-foreground">
                                                    Kod: {returnItem.productCode}
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {returnItem.quantity}
                                        </TableCell>
                                        <TableCell>
                                            {returnItem.days} kun
                                            {returnItem.discountDays > 0 && (
                                                <div className="text-xs text-muted-foreground">
                                                    Chegirma: {returnItem.discountDays} kun
                                                </div>
                                            )}
                                            <div className="text-xs text-muted-foreground">
                                                {new Date(returnItem.startDate).toLocaleDateString()} - {new Date(returnItem.returnDate).toLocaleDateString()}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            {returnItem.dailyRate?.toLocaleString()} so'm
                                        </TableCell>
                                        <TableCell>
                                            {returnItem.totalCost?.toLocaleString()} so'm
                                            <div className="text-xs text-muted-foreground">
                                                {returnItem.dailyRate?.toLocaleString()} × {returnItem.days} kun × {returnItem.quantity} dona
                                            </div>
                                            {returnItem.discount > 0 && (
                                                <div className="text-xs text-orange-600">
                                                    Чегирма: {returnItem.discount?.toLocaleString()} сўм
                                                </div>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                                {!rentals.some(rental => rental.returnedProducts?.length > 0) && (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center">
                                            Qaytarish tarixi mavjud emas
                                        </TableCell>
                                    </TableRow>
                                )}
                                {rentals.some(rental => rental.returnedProducts?.length > 0) && (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-right">
                                            <span className="text-gray-600 font-medium">Жами қайтариш суммаси:</span>
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-lg font-semibold text-green-600">
                                                {getReturnHistory().reduce((total, item) => 
                                                    total + (item.totalCost || 0), 0).toLocaleString()} сўм
                                            </span>
                                        </TableCell>
                                    </TableRow>
                                )}
                                {rentals.some(rental => rental.returnedProducts?.length > 0) && (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-right">
                                            <span className="text-gray-600 font-medium">Жами чегирма:</span>
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-lg font-semibold text-orange-600">
                                                {getReturnHistory().reduce((total, item) => 
                                                    total + (item.discount || 0), 0).toLocaleString()} сўм
                                            </span>
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {/* Return Product Dialog */}
                <Dialog open={returnDialogOpen} onOpenChange={setReturnDialogOpen}>
                    <DialogContent className="bg-white dark:bg-gray-800">
                        <DialogHeader className="bg-gradient-to-r from-blue-50 to-white dark:from-blue-900/50 dark:to-gray-800 border-b dark:border-gray-700 pb-4">
                            <DialogTitle className="text-blue-700 dark:text-blue-300">Маҳсулотни қайтариш</DialogTitle>
                        </DialogHeader>
                        {selectedRental && selectedProduct && (
                            <div className="space-y-4 pt-4">
                                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                                    <Label className="text-gray-600 dark:text-gray-300">Ижара рақами</Label>
                                    <p className="text-lg font-medium text-gray-900 dark:text-gray-100">{selectedRental.rentalNumber}</p>
                                </div>
                                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                                    <Label className="text-gray-600 dark:text-gray-300">Маҳсулот</Label>
                                    <p className="text-lg font-medium text-gray-900 dark:text-gray-100">{selectedProduct.product?.name}</p>
                                </div>
                                <div>
                                    <Label className="text-gray-600 dark:text-gray-300">Қайтариш миқдори</Label>
                                    <Input
                                        type="number"
                                        min="1"
                                        max={getRemainingQuantity(selectedRental, selectedProduct)}
                                        value={returnQuantity}
                                        onChange={(e) => setReturnQuantity(parseInt(e.target.value))}
                                        className="border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400"
                                    />
                                </div>
                                <div>
                                    <Label className="text-gray-600 dark:text-gray-300">Қайтариш санаси</Label>
                                    <Input
                                        type="date"
                                        value={returnDate}
                                        onChange={(e) => setReturnDate(e.target.value)}
                                        className="border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-blue-500 dark:focus:ring-blue-400"
                                    />
                                </div>
                                <div className="flex justify-end">
                                    <Button 
                                        onClick={handleReturn}
                                        className="bg-blue-600 hover:bg-blue-700 text-white dark:bg-blue-500 dark:hover:bg-blue-600"
                                    >
                                        Қайтариш
                                    </Button>
                                </div>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>
            </div>

        </div>
    );
}
