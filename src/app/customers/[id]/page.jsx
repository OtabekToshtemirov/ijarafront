'use client';

import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useParams, useRouter } from "next/navigation";
import { Loader2, ChevronDown, ChevronUp, ArrowLeft } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { fetchCustomers } from "@/lib/features/customers/customerSlice";
import { 
    fetchRentalsByCustomerId, 
    addReturnedProduct, 
    clearReturnStatus,
    selectReturnRentalStatus,
    selectRentals,
    selectRentalsStatus 
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
    const rentals = useSelector(selectRentals) || [];
    const payments = useSelector(selectPayments) || [];
    const status = useSelector((state) => state.customers.status);
    const rentalsStatus = useSelector(selectRentalsStatus);
    const paymentsStatus = useSelector(selectPaymentsStatus);
    const returnStatus = useSelector(selectReturnRentalStatus);

    const [expandedRental, setExpandedRental] = useState(null);
    const [returnProduct, setReturnProduct] = useState(null);

    useEffect(() => {
        const loadData = async () => {
            if (status === 'idle') {
                await dispatch(fetchCustomers());
            }
            if (id) {
                await Promise.all([
                    dispatch(fetchRentalsByCustomerId(id)),
                    dispatch(fetchPaymentsByCustomerId(id))
                ]);
            }
        };
        loadData();
    }, [dispatch, id, status]);

    useEffect(() => {
        // Clear return status when component unmounts
        return () => {
            dispatch(clearReturnStatus());
        };
    }, [dispatch]);

    const handleExpandRental = (rentalId) => {
        setExpandedRental(expandedRental === rentalId ? null : rentalId);
    };

    const handleReturnProduct = async (rental, borrowedProduct) => {
        try {
            if (!returnProduct?.quantity || returnProduct.quantity > borrowedProduct.quantity) {
                toast.error("Qaytarish miqdori noto'g'ri");
                return;
            }

            const result = await dispatch(addReturnedProduct({
                rentalId: rental._id,
                product: borrowedProduct.product._id,
                quantity: returnProduct.quantity,
                returnDate: new Date()
            }));

            if (result.meta.requestStatus === 'fulfilled') {
                toast.success(`Mahsulot muvaffaqiyatli qaytarildi. Narxi: ${result.payload.returnedCost.toLocaleString()} so'm`);
                setReturnProduct(null);
                // Refresh rentals after successful return
                dispatch(fetchRentalsByCustomerId(id));
            }
        } catch (error) {
            toast.error('Xatolik yuz berdi');
        }
    };

    if (status === 'loading' || !customer) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin" />
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
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm font-medium">Ism:</p>
                                <p className="text-lg">{customer.name}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium">Telefon:</p>
                                <p className="text-lg">{customer.phone}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium">Manzil:</p>
                                <p className="text-lg">{customer.address}</p>
                            </div>
                            <div>
                                <p className="text-sm font-medium">Balans:</p>
                                <p className="text-lg">{customer.balance?.toLocaleString()} so'm</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Rentals */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Ijaralar tarixi</CardTitle>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <div className="h-2 w-2 rounded-full bg-green-500"></div>
                                <span>Faol</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <div className="h-2 w-2 rounded-full bg-gray-500"></div>
                                <span>Yakunlangan</span>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {rentalsStatus === 'loading' ? (
                            <div className="flex justify-center py-4">
                                <Loader2 className="h-6 w-6 animate-spin" />
                            </div>
                        ) : rentals.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                                <svg
                                    className="h-12 w-12 text-gray-400"
                                    fill="none"
                                    height="24"
                                    stroke="currentColor"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    viewBox="0 0 24 24"
                                    width="24"
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <path d="M5 7.2A2.2 2.2 0 0 1 7.2 5h9.6A2.2 2.2 0 0 1 19 7.2v9.6a2.2 2.2 0 0 1-2.2 2.2H7.2A2.2 2.2 0 0 1 5 16.8V7.2Z" />
                                    <path d="M9 11.7c0 .2.1.3.3.3h5.4c.2 0 .3-.1.3-.3V8.3c0-.2-.1-.3-.3-.3H9.3c-.2 0-.3.1-.3.3v3.4Z" />
                                    <path d="M8 15h8" />
                                </svg>
                                <p className="mt-2">Ijaralar mavjud emas</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {rentals.map((rental) => (
                                    <div 
                                        key={rental._id} 
                                        className={`rounded-lg border bg-card text-card-foreground shadow-sm transition-all duration-200 hover:shadow-md ${
                                            expandedRental === rental._id ? 'ring-2 ring-primary' : ''
                                        }`}
                                    >
                                        <div 
                                            className="p-6 cursor-pointer"
                                            onClick={() => handleExpandRental(rental._id)}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="grid grid-cols-4 gap-6 flex-1">
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-medium">Sana</span>
                                                        <span className="text-muted-foreground">
                                                            {new Date(rental.startDate).toLocaleDateString()}
                                                        </span>
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-medium">Summa</span>
                                                        <span className="text-muted-foreground">
                                                            {rental.totalCost?.toLocaleString()} so'm
                                                        </span>
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-medium">Status</span>
                                                        <div className="flex items-center gap-2">
                                                            <div className={`h-2 w-2 rounded-full ${
                                                                rental.status === 'active' ? 'bg-green-500' : 'bg-gray-500'
                                                            }`} />
                                                            <span className="text-muted-foreground capitalize">
                                                                {rental.status === 'active' ? 'Faol' : 'Yakunlangan'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-medium">Mashina</span>
                                                        <span className="text-muted-foreground">
                                                            {rental.car?.carNumber || '-'}
                                                        </span>
                                                    </div>
                                                </div>
                                                <Button variant="ghost" size="icon">
                                                    {expandedRental === rental._id ? 
                                                        <ChevronUp className="h-4 w-4" /> : 
                                                        <ChevronDown className="h-4 w-4" />
                                                    }
                                                </Button>
                                            </div>

                                            {expandedRental === rental._id && (
                                                <div className="mt-6 space-y-6 border-t pt-6">
                                                    {/* Borrowed Products */}
                                                    <div>
                                                        <h3 className="text-lg font-semibold mb-4">Olingan mahsulotlar</h3>
                                                        <div className="rounded-lg border">
                                                            <Table>
                                                                <TableHeader>
                                                                    <TableRow>
                                                                        <TableHead>Mahsulot</TableHead>
                                                                        <TableHead>Soni</TableHead>
                                                                        <TableHead>Boshlanish sanasi</TableHead>
                                                                        <TableHead>Tugash sanasi</TableHead>
                                                                        <TableHead>Amallar</TableHead>
                                                                    </TableRow>
                                                                </TableHeader>
                                                                <TableBody>
                                                                    {rental.borrowedProducts.map((prod, index) => {
                                                                        const returnedQuantity = rental.returnedProducts
                                                                            .filter(rp => rp.product?._id === prod.product?._id)
                                                                            .reduce((sum, rp) => sum + rp.quantity, 0);
                                                                        const remainingQuantity = prod.quantity - returnedQuantity;

                                                                        return (
                                                                            <TableRow key={index}>
                                                                                <TableCell className="font-medium">
                                                                                    {prod.product?.name || 'Noma\'lum mahsulot'}
                                                                                </TableCell>
                                                                                <TableCell>
                                                                                    {prod.quantity} 
                                                                                    {remainingQuantity !== prod.quantity && (
                                                                                        <span className="text-sm text-muted-foreground ml-2">
                                                                                            (Qoldi: {remainingQuantity})
                                                                                        </span>
                                                                                    )}
                                                                                </TableCell>
                                                                                <TableCell>
                                                                                    {prod.startDate ? new Date(prod.startDate).toLocaleDateString() : '-'}
                                                                                </TableCell>
                                                                                <TableCell>
                                                                                    {prod.endDate ? new Date(prod.endDate).toLocaleDateString() : '-'}
                                                                                </TableCell>
                                                                                <TableCell>
                                                                                    {remainingQuantity > 0 && rental.status === 'active' && (
                                                                                        <div className="flex items-center gap-2">
                                                                                            <Input
                                                                                                type="number"
                                                                                                placeholder="Miqdor"
                                                                                                className="w-20"
                                                                                                min="1"
                                                                                                max={remainingQuantity}
                                                                                                value={returnProduct?.productId === prod.product?._id ? returnProduct.quantity : ''}
                                                                                                onChange={(e) => setReturnProduct({
                                                                                                    productId: prod.product?._id,
                                                                                                    quantity: parseInt(e.target.value)
                                                                                                })}
                                                                                            />
                                                                                            <Button
                                                                                                size="sm"
                                                                                                disabled={returnStatus === 'loading'}
                                                                                                onClick={() => handleReturnProduct(rental, prod)}
                                                                                            >
                                                                                                {returnStatus === 'loading' ? 
                                                                                                    <Loader2 className="h-4 w-4 animate-spin" /> : 
                                                                                                    'Qaytarish'
                                                                                                }
                                                                                            </Button>
                                                                                        </div>
                                                                                    )}
                                                                                </TableCell>
                                                                            </TableRow>
                                                                        );
                                                                    })}
                                                                </TableBody>
                                                            </Table>
                                                        </div>
                                                    </div>

                                                    {/* Returned Products */}
                                                    {rental.returnedProducts.length > 0 && (
                                                        <div>
                                                            <h3 className="text-lg font-semibold mb-4">Qaytarilgan mahsulotlar</h3>
                                                            <div className="rounded-lg border">
                                                                <Table>
                                                                    <TableHeader>
                                                                        <TableRow>
                                                                            <TableHead>Mahsulot</TableHead>
                                                                            <TableHead>Soni</TableHead>
                                                                            <TableHead>Qaytarish sanasi</TableHead>
                                                                            <TableHead>Narxi</TableHead>
                                                                        </TableRow>
                                                                    </TableHeader>
                                                                    <TableBody>
                                                                        {rental.returnedProducts.map((prod, index) => (
                                                                            <TableRow key={index}>
                                                                                <TableCell className="font-medium">
                                                                                    {prod.product?.name || 'Noma\'lum mahsulot'}
                                                                                </TableCell>
                                                                                <TableCell>{prod.quantity}</TableCell>
                                                                                <TableCell>
                                                                                    {prod.returnDate ? new Date(prod.returnDate).toLocaleDateString() : '-'}
                                                                                </TableCell>
                                                                                <TableCell>
                                                                                    {prod.cost?.toLocaleString()} so'm
                                                                                </TableCell>
                                                                            </TableRow>
                                                                        ))}
                                                                    </TableBody>
                                                                </Table>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Payments */}
                <Card>
                    <CardHeader>
                        <CardTitle>To'lovlar</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {paymentsStatus === 'loading' ? (
                            <div className="flex justify-center py-4">
                                <Loader2 className="h-6 w-6 animate-spin" />
                            </div>
                        ) : payments.length === 0 ? (
                            <p className="text-center text-muted-foreground py-4">To'lovlar mavjud emas</p>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Sana</TableHead>
                                        <TableHead>Miqdor</TableHead>
                                        <TableHead>To'lov usuli</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {payments.map((payment) => (
                                        <TableRow key={payment._id}>
                                            <TableCell>{new Date(payment.paymentDate).toLocaleDateString()}</TableCell>
                                            <TableCell>{payment.amount.toLocaleString()} so'm</TableCell>
                                            <TableCell>{payment.paymentMethod}</TableCell>
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
