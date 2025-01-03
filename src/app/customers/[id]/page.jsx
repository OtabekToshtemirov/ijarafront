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
} from "@/lib/features/rentals/rentalsSlice";
import { 
    fetchPaymentsByCustomerId,
    selectPayments,
    selectPaymentsStatus 
} from "@/lib/features/payments/paymentSlice";
import { toast } from "sonner";

export default function CustomerDetailsPage() {
    const dispatch = useDispatch();
    const router = useRouter();
    const { id } = useParams();
    
    const customer = useSelector((state) => state.customers.customers.find(c => c._id === id));
    const rentals = useSelector((state) => state.rentals.rentals) || [];
    const payments = useSelector(selectPayments) || [];
    const status = useSelector((state) => state.customers.status);
    const paymentsStatus = useSelector(selectPaymentsStatus);

    const [returnDialogOpen, setReturnDialogOpen] = useState(false);
    const [selectedRental, setSelectedRental] = useState(null);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [returnQuantity, setReturnQuantity] = useState(1);
    const [returnDate, setReturnDate] = useState(new Date().toISOString().split('T')[0]);

    useEffect(() => {
        dispatch(fetchCustomers());
    }, [dispatch]);

    useEffect(() => {
        if (id) {
            dispatch(fetchRentalsByCustomerId(id));
            dispatch(fetchPaymentsByCustomerId(id));
        }
    }, [dispatch, id]);

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
        return rentals.flatMap(rental => {
            return rental.borrowedProducts.filter(product => {
                const returnedQuantity = rental.returnedProducts
                    ?.filter(rp => rp.product?._id === product.product?._id)
                    ?.reduce((sum, rp) => sum + rp.quantity, 0) || 0;
                return returnedQuantity < product.quantity;
            }).map(product => ({
                ...product,
                rental,
                remainingQuantity: getRemainingQuantity(rental, product)
            }));
        });
    };

    // Calculate remaining quantity
    const getRemainingQuantity = (rental, product) => {
        const returnedQuantity = rental.returnedProducts
            ?.filter(rp => rp.product?._id === product.product?._id)
            ?.reduce((sum, rp) => sum + rp.quantity, 0) || 0;
        return product.quantity - returnedQuantity;
    };

    const openReturnDialog = (rental, product) => {
        setSelectedRental(rental);
        setSelectedProduct(product);
        setReturnDialogOpen(true);
    };

    const handleReturn = async () => {
        if (!returnQuantity || returnQuantity <= 0) {
            toast.error("Qaytarish miqdorini kiriting!");
            return;
        }

        const remainingQuantity = getRemainingQuantity(selectedRental, selectedProduct);
        if (returnQuantity > remainingQuantity) {
            toast.error("Qaytarish miqdori qolgan miqdordan ko'p bo'lishi mumkin emas!");
            return;
        }

        try {
            await dispatch(addReturnedProduct({
                rentalId: selectedRental._id,
                productId: selectedProduct.product._id,
                quantity: returnQuantity,
                returnDate: returnDate
            })).unwrap();

            toast.success("Mahsulot muvaffaqiyatli qaytarildi");
            setReturnDialogOpen(false);
            setSelectedRental(null);
            setSelectedProduct(null);
            setReturnQuantity(1);
            
            // Refresh data
            dispatch(fetchRentalsByCustomerId(id));
        } catch (error) {
            toast.error("Xatolik yuz berdi");
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
                <p className="text-muted-foreground">Mijoz topilmadi</p>
            </div>
        );
    }

    return (
        <div className="container mx-auto py-10">
            <div className="mb-6">
                <Button variant="ghost" onClick={() => router.back()} className="hover:bg-blue-50">
                    <ArrowLeft className="h-4 w-4 mr-2 text-blue-600" />
                    <span className="text-blue-600">Orqaga</span>
                </Button>
            </div>

            <div className="grid gap-6">
                {/* Customer Information */}
                <Card className="border-t-4 border-t-blue-500 shadow-lg dark:bg-gray-800">
                    <CardHeader className="bg-gradient-to-r from-blue-50 to-white dark:from-blue-900/50 dark:to-gray-800">
                        <CardTitle className="text-blue-700 dark:text-blue-300">Mijoz ma'lumotlari</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid md:grid-cols-3 gap-6">
                            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                                <h3 className="font-medium mb-2 text-blue-700 dark:text-blue-300">Asosiy ma'lumotlar</h3>
                                <div className="space-y-2">
                                    <p className="text-gray-700 dark:text-gray-300"><span className="font-medium">Ism:</span> {customer.name}</p>
                                    <p className="text-gray-700 dark:text-gray-300"><span className="font-medium">Telefon:</span> {customer.phone}</p>
                                    <p className="text-gray-700 dark:text-gray-300"><span className="font-medium">Manzil:</span> {customer.address}</p>
                                    <Badge className={customer.status === 'VIP' ? 'bg-yellow-500 dark:bg-yellow-600' : 'bg-blue-500 dark:bg-blue-600'}>
                                        {customer.status === 'VIP' ? 'VIP' : 'Oddiy'}
                                    </Badge>
                                </div>
                            </div>
                            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                                <h3 className="font-medium mb-2 text-green-700 dark:text-green-300">Moliyaviy ma'lumotlar</h3>
                                <div className="space-y-2">
                                    <p className="text-gray-700 dark:text-gray-300">
                                        <span className="font-medium">Balans:</span> 
                                        <span className={customer.balance >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                                            {customer.balance?.toLocaleString()} so'm
                                        </span>
                                    </p>
                                    <p className="text-gray-700 dark:text-gray-300">
                                        <span className="font-medium">Jami to'lovlar:</span>
                                        <span className="text-green-600 dark:text-green-400"> {totalPayments.toLocaleString()} so'm</span>
                                    </p>
                                    <p className="text-gray-700 dark:text-gray-300">
                                        <span className="font-medium">Qaytarishlar:</span>
                                        <span className="text-blue-600 dark:text-blue-400"> {totalReturnsCost.toLocaleString()} so'm</span>
                                    </p>
                                </div>
                            </div>
                            <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                                <h3 className="font-medium mb-2 text-purple-700 dark:text-purple-300">Statistika</h3>
                                <div className="space-y-2">
                                    <p className="text-gray-700 dark:text-gray-300">
                                        <span className="font-medium">Faol ijaralar:</span>
                                        <span className="text-purple-600 dark:text-purple-400"> {activeRentals.length} ta</span>
                                    </p>
                                    <p className="text-gray-700 dark:text-gray-300">
                                        <span className="font-medium">Jami ijaralar:</span>
                                        <span className="text-purple-600 dark:text-purple-400"> {rentals.length} ta</span>
                                    </p>
                                    <p className="text-gray-700 dark:text-gray-300">
                                        <span className="font-medium">Qaytarilmagan maxsulotlar:</span>
                                        <span className="text-purple-600 dark:text-purple-400"> {getUnreturnedProducts().length} ta</span>
                                    </p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Active Rentals */}
                <Card className="border-t-4 border-t-green-500 shadow-lg dark:bg-gray-800">
                    <CardHeader className="bg-gradient-to-r from-green-50 to-white dark:from-green-900/50 dark:to-gray-800">
                        <CardTitle className="text-green-700 dark:text-green-300">Faol ijaralar</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {activeRentals.length === 0 ? (
                            <div className="text-center py-4 text-muted-foreground dark:text-gray-400">
                                Faol ijaralar mavjud emas
                            </div>
                        ) : (
                            <div className="rounded-md border dark:border-gray-700">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="dark:border-gray-700">
                                            <TableHead className="dark:text-gray-300">Sana</TableHead>
                                            <TableHead className="dark:text-gray-300">Mahsulotlar</TableHead>
                                            <TableHead className="dark:text-gray-300">Umumiy narx</TableHead>
                                            <TableHead className="dark:text-gray-300">Qarz</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {activeRentals.map((rental) => (
                                            <TableRow key={rental._id} className="dark:border-gray-700">
                                                <TableCell className="dark:text-gray-300">{new Date(rental.workStartDate || rental.createdAt).toLocaleDateString()}</TableCell>
                                                <TableCell className="dark:text-gray-300">
                                                    {rental.borrowedProducts.map((product, index) => (
                                                        <div key={index}>
                                                            {product.product?.name} ({product.quantity} dona)
                                                        </div>
                                                    ))}
                                                </TableCell>
                                                <TableCell className="dark:text-gray-300">{rental.totalCost?.toLocaleString()} so'm</TableCell>
                                                <TableCell>
                                                    {rental.debt > 0 ? (
                                                        <span className="text-red-500 dark:text-red-400">{rental.debt?.toLocaleString()} so'm</span>
                                                    ) : (
                                                        <Badge variant="success" className="dark:bg-green-700">To'langan</Badge>
                                                    )}
                                                </TableCell>
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
                        <CardTitle className="text-red-700 dark:text-red-300">Qaytarilmagan mahsulotlar</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {getUnreturnedProducts().length === 0 ? (
                            <div className="text-center py-4 text-muted-foreground dark:text-gray-400">
                                Qaytarilmagan mahsulotlar mavjud emas
                            </div>
                        ) : (
                            <div className="rounded-md border dark:border-gray-700">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="dark:border-gray-700">
                                            <TableHead className="dark:text-gray-300">Mahsulot</TableHead>
                                            <TableHead className="dark:text-gray-300">Ijara sanasi</TableHead>
                                            <TableHead className="dark:text-gray-300">Qolgan miqdor</TableHead>
                                            <TableHead className="dark:text-gray-300">Amallar</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {getUnreturnedProducts().map((product, index) => (
                                            <TableRow key={index} className="dark:border-gray-700">
                                                <TableCell className="dark:text-gray-300">{product.product?.name}</TableCell>
                                                <TableCell className="dark:text-gray-300">
                                                    {new Date(product.rental.workStartDate || product.rental.createdAt).toLocaleDateString()}
                                                </TableCell>
                                                <TableCell className="dark:text-gray-300">{product.remainingQuantity} dona</TableCell>
                                                <TableCell>
                                                    <Button 
                                                        size="sm" 
                                                        onClick={() => openReturnDialog(product.rental, product)}
                                                        className="dark:bg-blue-600 dark:hover:bg-blue-700 dark:text-white"
                                                    >
                                                        Qaytarish
                                                    </Button>
                                                </TableCell>
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
                        <CardTitle className="text-purple-700 dark:text-purple-300">Barcha ijaralar tarixi</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {rentals.length === 0 ? (
                            <div className="text-center py-4 text-muted-foreground dark:text-gray-400">
                                Ijaralar tarixi mavjud emas
                            </div>
                        ) : (
                            <div className="rounded-md border dark:border-gray-700">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="dark:border-gray-700">
                                            <TableHead className="dark:text-gray-300">Sana</TableHead>
                                            <TableHead className="dark:text-gray-300">Mahsulotlar</TableHead>
                                            <TableHead className="dark:text-gray-300">Umumiy narx</TableHead>
                                            <TableHead className="dark:text-gray-300">Status</TableHead>
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
                                                            {product.product?.name} ({product.quantity} dona)
                                                        </div>
                                                    ))}
                                                </TableCell>
                                                <TableCell className="dark:text-gray-300">{rental.totalCost?.toLocaleString()} so'm</TableCell>
                                                <TableCell>
                                                    <Badge 
                                                        variant={rental.status === 'active' ? 'default' : 'secondary'}
                                                        className={rental.status === 'active' ? 'dark:bg-blue-600' : 'dark:bg-gray-600'}
                                                    >
                                                        {rental.status === 'active' ? 'Faol' : 'Yakunlangan'}
                                                    </Badge>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Payments History */}
                <Card className="border-t-4 border-t-indigo-500 shadow-lg dark:bg-gray-800">
                    <CardHeader className="bg-gradient-to-r from-indigo-50 to-white dark:from-indigo-900/50 dark:to-gray-800">
                        <CardTitle className="text-indigo-700 dark:text-indigo-300">To'lovlar tarixi</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {payments.length === 0 ? (
                            <div className="text-center py-4 text-muted-foreground dark:text-gray-400">
                                To'lovlar tarixi mavjud emas
                            </div>
                        ) : (
                            <div className="rounded-md border dark:border-gray-700">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="dark:border-gray-700">
                                            <TableHead className="dark:text-gray-300">Sana</TableHead>
                                            <TableHead className="dark:text-gray-300">Summa</TableHead>
                                            <TableHead className="dark:text-gray-300">To'lov turi</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {payments.map((payment) => (
                                            <TableRow key={payment._id} className="dark:border-gray-700">
                                                <TableCell className="dark:text-gray-300">
                                                    {new Date(payment.paymentDate).toLocaleDateString()}
                                                </TableCell>
                                                <TableCell className="dark:text-gray-300">{payment.amount?.toLocaleString()} so'm</TableCell>
                                                <TableCell className="dark:text-gray-300">
                                                    {payment.paymentType === 'cash' ? 'Naqd' : 'Plastik'}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Return Product Dialog */}
            <Dialog open={returnDialogOpen} onOpenChange={setReturnDialogOpen}>
                <DialogContent className="bg-white dark:bg-gray-800">
                    <DialogHeader className="bg-gradient-to-r from-blue-50 to-white dark:from-blue-900/50 dark:to-gray-800 border-b dark:border-gray-700 pb-4">
                        <DialogTitle className="text-blue-700 dark:text-blue-300">Mahsulotni qaytarish</DialogTitle>
                    </DialogHeader>
                    {selectedRental && selectedProduct && (
                        <div className="space-y-4 pt-4">
                            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                                <Label className="text-gray-600 dark:text-gray-300">Ijara raqami</Label>
                                <p className="text-lg font-medium text-gray-900 dark:text-gray-100">{selectedRental.rentalNumber}</p>
                            </div>
                            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                                <Label className="text-gray-600 dark:text-gray-300">Mahsulot</Label>
                                <p className="text-lg font-medium text-gray-900 dark:text-gray-100">{selectedProduct.product?.name}</p>
                            </div>
                            <div>
                                <Label className="text-gray-600 dark:text-gray-300">Qaytarish miqdori</Label>
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
                                <Label className="text-gray-600 dark:text-gray-300">Qaytarish sanasi</Label>
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
                                    Qaytarish
                                </Button>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
