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

    const [returnProduct, setReturnProduct] = useState(null);
    const [returnQuantity, setReturnQuantity] = useState(1);

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

    // Handle product return
    const handleReturn = async (rental, product) => {
        if (!returnQuantity || returnQuantity <= 0) {
            toast.error("Qaytarish miqdorini kiriting!");
            return;
        }

        const remainingQuantity = getRemainingQuantity(rental, product);
        if (returnQuantity > remainingQuantity) {
            toast.error("Qaytarish miqdori qolgan miqdordan ko'p bo'lishi mumkin emas!");
            return;
        }

        try {
            await dispatch(addReturnedProduct({
                rentalId: rental._id,
                productId: product.product._id,
                quantity: returnQuantity
            })).unwrap();

            toast.success("Mahsulot muvaffaqiyatli qaytarildi");
            setReturnProduct(null);
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
                <Button variant="ghost" onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Orqaga
                </Button>
            </div>

            <div className="grid gap-6">
                {/* Customer Information */}
                <Card>
                    <CardHeader>
                        <CardTitle>Mijoz ma'lumotlari</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid md:grid-cols-3 gap-6">
                            <div>
                                <h3 className="font-medium mb-2">Asosiy ma'lumotlar</h3>
                                <div className="space-y-1">
                                    <p>Ism: {customer.name}</p>
                                    <p>Telefon: {customer.phone}</p>
                                    <p>Manzil: {customer.address}</p>
                                    <Badge>{customer.status === 'VIP' ? 'VIP' : 'Oddiy'}</Badge>
                                </div>
                            </div>
                            <div>
                                <h3 className="font-medium mb-2">Moliyaviy ma'lumotlar</h3>
                                <div className="space-y-1">
                                    <p>Balans: {customer.balance?.toLocaleString()} so'm</p>
                                    <p>Jami to'lovlar: {totalPayments.toLocaleString()} so'm</p>
                                    <p>Qaytarishlar: {totalReturnsCost.toLocaleString()} so'm</p>
                                </div>
                            </div>
                            <div>
                                <h3 className="font-medium mb-2">Statistika</h3>
                                <div className="space-y-1">
                                    <p>Faol ijaralar: {activeRentals.length} ta</p>
                                    <p>Jami ijaralar: {rentals.length} ta</p>
                                    <p>Qaytarilmagan maxsulotlar: {getUnreturnedProducts().length} ta</p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Active Rentals */}
                <Card>
                    <CardHeader>
                        <CardTitle>Faol ijaralar</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {activeRentals.length === 0 ? (
                            <div className="text-center py-4 text-muted-foreground">
                                Faol ijaralar mavjud emas
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Sana</TableHead>
                                        <TableHead>Mahsulotlar</TableHead>
                                        <TableHead>Umumiy narx</TableHead>
                                        <TableHead>Qarz</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {activeRentals.map((rental) => (
                                        <TableRow key={rental._id}>
                                            <TableCell>{new Date(rental.workStartDate || rental.createdAt).toLocaleDateString()}</TableCell>
                                            <TableCell>
                                                {rental.borrowedProducts.map((product, index) => (
                                                    <div key={index}>
                                                        {product.product?.name} ({product.quantity} dona)
                                                    </div>
                                                ))}
                                            </TableCell>
                                            <TableCell>{rental.totalCost?.toLocaleString()} so'm</TableCell>
                                            <TableCell>
                                                {rental.debt > 0 ? (
                                                    <span className="text-red-500">{rental.debt?.toLocaleString()} so'm</span>
                                                ) : (
                                                    <Badge variant="success">To'langan</Badge>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>

                {/* Unreturned Products */}
                <Card>
                    <CardHeader>
                        <CardTitle>Qaytarilmagan mahsulotlar</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {getUnreturnedProducts().length === 0 ? (
                            <div className="text-center py-4 text-muted-foreground">
                                Qaytarilmagan mahsulotlar mavjud emas
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Mahsulot</TableHead>
                                        <TableHead>Ijara sanasi</TableHead>
                                        <TableHead>Qolgan miqdor</TableHead>
                                        <TableHead>Amallar</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {getUnreturnedProducts().map((product, index) => (
                                        <TableRow key={index}>
                                            <TableCell>{product.product?.name}</TableCell>
                                            <TableCell>
                                                {new Date(product.rental.workStartDate || product.rental.createdAt).toLocaleDateString()}
                                            </TableCell>
                                            <TableCell>{product.remainingQuantity} dona</TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        max={product.remainingQuantity}
                                                        value={returnProduct?.productId === product.product?._id ? returnQuantity : ''}
                                                        onChange={(e) => {
                                                            setReturnProduct({
                                                                productId: product.product?._id,
                                                                quantity: parseInt(e.target.value)
                                                            });
                                                            setReturnQuantity(parseInt(e.target.value));
                                                        }}
                                                        className="w-20 px-2 py-1 border rounded"
                                                    />
                                                    <Button
                                                        size="sm"
                                                        onClick={() => handleReturn(product.rental, product)}
                                                    >
                                                        Qaytarish
                                                    </Button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>

                {/* All Rentals History */}
                <Card>
                    <CardHeader>
                        <CardTitle>Barcha ijaralar tarixi</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {rentals.length === 0 ? (
                            <div className="text-center py-4 text-muted-foreground">
                                Ijaralar tarixi mavjud emas
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Sana</TableHead>
                                        <TableHead>Mahsulotlar</TableHead>
                                        <TableHead>Umumiy narx</TableHead>
                                        <TableHead>Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {rentals.map((rental) => (
                                        <TableRow key={rental._id}>
                                            <TableCell>
                                                {new Date(rental.workStartDate || rental.createdAt).toLocaleDateString()}
                                            </TableCell>
                                            <TableCell>
                                                {rental.borrowedProducts.map((product, index) => (
                                                    <div key={index}>
                                                        {product.product?.name} ({product.quantity} dona)
                                                    </div>
                                                ))}
                                            </TableCell>
                                            <TableCell>{rental.totalCost?.toLocaleString()} so'm</TableCell>
                                            <TableCell>
                                                <Badge variant={rental.status === 'active' ? 'default' : 'secondary'}>
                                                    {rental.status === 'active' ? 'Faol' : 'Yakunlangan'}
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>

                {/* Payments History */}
                <Card>
                    <CardHeader>
                        <CardTitle>To'lovlar tarixi</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {payments.length === 0 ? (
                            <div className="text-center py-4 text-muted-foreground">
                                To'lovlar tarixi mavjud emas
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Sana</TableHead>
                                        <TableHead>Summa</TableHead>
                                        <TableHead>To'lov turi</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {payments.map((payment) => (
                                        <TableRow key={payment._id}>
                                            <TableCell>
                                                {new Date(payment.paymentDate).toLocaleDateString()}
                                            </TableCell>
                                            <TableCell>{payment.amount?.toLocaleString()} so'm</TableCell>
                                            <TableCell>
                                                {payment.paymentType === 'cash' ? 'Naqd' : 'Plastik'}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
