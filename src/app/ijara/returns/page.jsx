'use client';

import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Search } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { fetchRentals, returnProduct, createPayment, fetchRentalById } from "@/lib/features/rentals/rentalsSlice";
import { toast } from "sonner";

export default function Component() {
    const dispatch = useDispatch();
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [returnQuantities, setReturnQuantities] = useState({});
    const [discountDays, setDiscountDays] = useState({});
    const [returnDates, setReturnDates] = useState({});
    const [localRentals, setLocalRentals] = useState([]);
    const [totalDiscount, setTotalDiscount] = useState(0);
    const [returnedProducts, setReturnedProducts] = useState([]);
    const [paymentAmount, setPaymentAmount] = useState('');
    const [paymentType, setPaymentType] = useState('cash');
    const [paymentDiscount, setPaymentDiscount] = useState('0');

    const rentals = useSelector((state) => state.rentals.rentals);
    const status = useSelector((state) => state.rentals.status);

    useEffect(() => {
        dispatch(fetchRentals());
    }, [dispatch]);

    useEffect(() => {
        if (rentals) {
            setLocalRentals(rentals);
        }
    }, [rentals]);

    // Get active rentals with unreturned products
    const activeRentals = localRentals.filter(rental => {
        if (rental.status !== 'active') return false;

        // Check if there are any unreturned products
        return rental.borrowedProducts.some(prod => {
            if (!prod.product?._id) return false;

            const returnedQuantity = rental.returnedProducts
                .filter(rp => rp.product?.toString() === prod.product._id.toString())
                .reduce((sum, rp) => sum + rp.quantity, 0);
            return prod.quantity - returnedQuantity > 0;
        });
    });

    // Group rentals by customer
    const customerRentals = activeRentals.reduce((acc, rental) => {
        const customerId = rental.customer?._id;
        if (!customerId) return acc;

        if (!acc[customerId]) {
            acc[customerId] = {
                customer: rental.customer,
                rentals: [],
                totalRentals: 0,
                unreturnedProducts: 0
            };
        }

        const unreturnedCount = rental.borrowedProducts.reduce((count, prod) => {
            if (!prod.product?._id) return count;

            const returnedQuantity = (rental.returnedProducts || [])
                .filter(rp => rp.product?._id?.toString() === prod.product._id.toString())
                .reduce((sum, rp) => sum + (rp.quantity || 0), 0);

            const unreturned = prod.quantity - returnedQuantity;
            return count + (unreturned > 0 ? unreturned : 0);
        }, 0);

        acc[customerId].rentals.push(rental);
        acc[customerId].totalRentals += 1;
        acc[customerId].unreturnedProducts += unreturnedCount;

        return acc;
    }, {});


    const PrintReturnedProductsOfRental = (returnedProducts) => {
        // Create a new window for printing
        const printWindow = window.open('', '_blank');
        
        // Generate the HTML content
        const printContent = `
            <!DOCTYPE html>
            <html>
            <head>
            <style>
            @page { 
            size: 80mm auto;
            margin: 0;
            }
            body {
            width: 80mm;
            padding: 5mm;
            font-family: Arial;
            }
            table { 
            width: 100%;
            font-size: 16px;
            border-collapse: collapse;
            }
            th, td {
            text-align: left;
            padding: 5px;
            }
            .dates {
            font-size: 12px;
            color: #666;
            }
            </style>
            </head>
            <body>
            <div style="text-align: center; margin-bottom: 15px">
            <h3>Қайтарилган Маҳсулотлар</h3>
            </div>

            <table>
            <tbody>
            ${returnedProducts.map(product => `
                <tr>
                <td colspan="2">
                <strong>${product.product.name}</strong>
                <div style="font-size: 14px; color: #000">
                ${product.days} кун × ${product.quantity} дона × ${product.dailyRate.toLocaleString()} сўм
                </div>
                <div class="dates" style="font-size: 12px; color: #000">
                    Бошланиш: <b>${new Date(product.startDate).toLocaleDateString()}</b> <br>
                    Қайтариш: <b>${new Date(product.returnDate).toLocaleDateString()} </b>
                </div>
                </td>
                <td style="text-align: right">
                <strong>${product.totalCost.toLocaleString()} сўм</strong>
                </td>
                </tr>
            `).join('')}
            </tbody>
            </table>

            <div style="margin-top: 15px; font-size: 14px">
            <div style="font-weight: bold; margin-bottom: 5px; font-size: 20px">
            ИЖАРА ҲАҚИ: 
            <span style="font-size: 20px; color: black">
                ${returnedProducts.reduce((total, product) => total + product.totalCost, 0).toLocaleString()} сўм
            </span>
            </div>
            <div style="text-align: center; margin-top: 10px; font-weight: bold; font-size: 30px">
            (90) 222 80 86
            </div>
            </div>
            </body>
            </html>
        `;

        // Write content to the new window
        printWindow.document.write(printContent);
        printWindow.document.close();

        // Print after images and resources are loaded
        printWindow.onload = function() {
            printWindow.print();
            printWindow.close();
        };
    };

    const handlePrint = (returnedProducts) => {
        PrintReturnedProductsOfRental(returnedProducts);
    };

    const filteredCustomers = Object.values(customerRentals).filter(item => {
        const searchLower = searchQuery.toLowerCase();
        return item.customer?.name.toLowerCase().includes(searchLower) ||
            item.customer?.phone.toLowerCase().includes(searchLower);
    });


    const calculateProductCost = (product, days, quantity) => {
        return (product.dailyRate || 0) * days * quantity;
    };

    const calculateDays = (startDate, returnDate, discountDays = 0) => {
        const start = new Date(startDate);
        const end = new Date(returnDate);
        const days = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));
        const totalDays = Math.max(1, days - discountDays);
        return {
            days,
            totalDays
        };
    };

    const handleReturnQuantityChange = (rentalId, productId, quantity, maxQuantity) => {
        // Yangi miqdorni qoldiq miqdor bilan cheklash
        const newQuantity = Math.min(Math.max(0, quantity), maxQuantity);

        setReturnQuantities(prev => ({
            ...prev,
            [`${rentalId}-${productId}`]: newQuantity
        }));
    };


    const handleDiscountDaysChange = (rentalId, days) => {
        if (days < 0) days = 0;
        setDiscountDays(prev => ({
            ...prev,
            [rentalId]: days
        }));
    };

    const handleReturnDateChange = (rentalId, productId, date) => {
        const key = `${rentalId}-${productId}`;
        setReturnDates(prev => ({
            ...prev,
            [key]: date
        }));
    };

    const handleReturn = async (rental, product) => {
        const key = `${rental._id}-${product.product._id}`;
        const quantity = Number(returnQuantities[key]);
        const discountDay = Number(discountDays[rental._id]) || 0;
        const returnDate = returnDates[key] ? new Date(returnDates[key]) : new Date();

        if (!quantity) return;

        // Qaytarish sanasi ish boshlash sanasidan oldin bo'lmasligi kerak
        if (returnDate < new Date(rental.workStartDate)) {
            toast.error("Qaytarish sanasi ish boshlash sanasidan oldin bo'lishi mumkin emas");
            return;
        }

        try {
            // Kunlarni hisoblaymiz
            const startDate = new Date(rental.workStartDate);
            console.log(startDate);
            const { days, totalDays } = calculateDays(startDate.toISOString().split('T')[0], returnDate.toISOString().split('T')[0], discountDay);

            // Kunlik narx va jami summani hisoblaymiz
            const dailyRate = Number(product.dailyRate) || 0;
            const totalCost = Number(totalDays * dailyRate * quantity);

            const returnData = {
                rentalId: rental._id,
                products: [{
                    product: product.product._id,
                    quantity: quantity,
                    startDate: startDate.toISOString(),
                    returnDate: returnDate.toISOString(),
                    discountDays: discountDay,
                    dailyRate: dailyRate,
                    totalCost: totalCost,
                    days: totalDays
                }]
            };


            // Qaytarish so'rovini yuborish
            const response = await dispatch(returnProduct(returnData)).unwrap();

            if (response.rental) {
                // Add returned product to the list
                setReturnedProducts(prev => [...prev, {
                    ...product,
                    quantity: quantity,
                    returnDate: returnDate,
                    days: totalDays,
                    totalCost: totalCost,
                    discount: totalDiscount
                }]);

                // Update local state with the returned rental data
                setLocalRentals(prev => prev.map(r =>
                    r._id === response.rental._id ? response.rental : r
                ));

                // Clear return quantity, discount days and return date
                setReturnQuantities(prev => ({
                    ...prev,
                    [key]: ''
                }));
                setDiscountDays(prev => ({
                    ...prev,
                    [rental._id]: 0
                }));
                setReturnDates(prev => ({
                    ...prev,
                    [key]: ''
                }));

                toast.success("Маҳсулот муваффақиятли қайтарилди");
            }
        } catch (error) {
            toast.error(error.message || "Хатолик юз берди");
        }
    };

    const handleDiscountChange = (value) => {
        const discount = Number(value) || 0;
        setTotalDiscount(discount);
    };

    const handlePayment = async () => {
        try {
            // Validate rental exists
            if (!selectedCustomer?.rentals?.[0]) {
                toast.error("Ижара маълумотлари топилмади");
                return;
            }

            const rental = selectedCustomer.rentals[0];

            // Calculate total cost from returned products
            const totalAmount = returnedProducts.reduce((total, product) => {
                const productTotal = product.totalCost || 0;
                return total + productTotal;
            }, 0);

            // Validate amount
            if (totalAmount <= 0) {
                toast.error("Тўлов суммаси нотўғри");
                return;
            }

            // Calculate final amount after discount
            const finalAmount = totalAmount - (totalDiscount || 0);

            // Prepare returned products summary for description
            const productsSummary = returnedProducts.map(p =>
                `${p.product?.name} (${p.quantity} dona)`
            ).join(', ');

            // Prepare payment data
            const paymentData = {
                customer: selectedCustomer.customer._id,
                rental: rental._id,
                amount: finalAmount,
                discount: Number(totalDiscount),
                paymentType: 'cash',
                description: `Қайтариш тўлови: ${productsSummary} - Чегирма: ${totalDiscount} so'm - ${new Date().toLocaleDateString()}`
            };


            // Create payment
            const response = await dispatch(createPayment(paymentData)).unwrap();

            if (response.success) {
                toast.success("Тўлов муваффақиятли сақланди");

                // Update data
                await Promise.all([
                    dispatch(fetchRentalById(rental._id)),
                    dispatch(fetchRentals())
                ]);

                // Clear form data
                setSelectedCustomer(null);
                setReturnedProducts([]);
                setTotalDiscount(0);

                // Refresh the page after a short delay
                setTimeout(() => {
                    window.location.reload();
                }, 1000);
            } else {
                toast.error(response.message || "Тўлов сақлашда хатолик юз берди");
            }
        } catch (error) {
            toast.error(error.message || "Тўлов сақлашда хатолик юз берди");
        }
    };

    const calculateCustomerBalance = (customerRentals) => {
        return customerRentals.reduce((balance, rental) => {
            // Add rental costs
            balance += rental.totalCost || 0;
            // Subtract payments
            balance -= rental.payments?.reduce((sum, payment) => sum + (payment.amount || 0), 0) || 0;
            return balance;
        }, 0);
    };

    // Calculate total sum of all returned products across all rentals
    const calculateAllReturnedTotal = (rentals) => {
        return rentals.reduce((total, rental) => {
            return total + rental.returnedProducts.reduce((rentalTotal, rp) => {
                return rentalTotal + (rp.totalCost || 0);
            }, 0);
        }, 0);
    };

    // Calculate current return total for all rentals
    const calculateAllCurrentReturnTotal = (rentals) => {
        return rentals.reduce((total, rental) => {
            return total + rental.borrowedProducts.reduce((rentalTotal, prod) => {
                const key = `${rental._id}-${prod.product._id}`;
                const returnQuantity = returnQuantities[key] || 0;
                if (!returnQuantity) return rentalTotal;

                const { totalDays } = calculateDays(
                    rental.workStartDate,
                    returnDates[key] || new Date().toISOString().split('T')[0],
                    discountDays[rental._id] || 0
                );

                const cost = calculateProductCost(prod, totalDays, returnQuantity);
                return rentalTotal + cost;
            }, 0);
        }, 0);
    };

    if (status === 'loading') {
        return <div>Юкланмоқда...</div>;
    }

    if (status === 'failed') {
        return <div>Хатолик юз берди</div>;
    }

    return (
        <div className="container mx-auto py-10">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-4xl font-bold">Мулкни қайтариш</h1>
            </div>

            <div className="flex gap-4 mb-6">
                <div className="flex-1">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Мижоз исми ёки телефон рақами бўйича қидириш"
                            className="pl-8"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {!selectedCustomer ? (
                // Customer List View
                <div className="border rounded-lg">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Мижоз</TableHead>
                                <TableHead>Телефон</TableHead>
                                <TableHead>Фаол ижаралар</TableHead>
                                <TableHead>Қайтарилмаган ашё</TableHead>
                                <TableHead></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredCustomers.map((item) => (
                                <TableRow key={item.customer._id}>
                                    <TableCell>{item.customer.name}</TableCell>
                                    <TableCell>{item.customer.phone}</TableCell>
                                    <TableCell>{item.totalRentals}</TableCell>
                                    <TableCell>
                                        <Badge variant="secondary">
                                            {item.unreturnedProducts} дона
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Button
                                            variant="outline"
                                            onClick={() => setSelectedCustomer(item)}
                                        >
                                            Қайтариш
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {filteredCustomers.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-4">
                                        Қайтарилмаган маҳсулотлари бор мижозлар топилмади
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            ) : (
                // Customer Detail View
                <div className="space-y-6">
                    <div className="flex items-center justify-between border-b pb-4">
                        <div className="space-y-1">
                            <h2 className="text-2xl font-semibold tracking-tight">
                                Қайтарилган маҳсулотлар ҳисоботи
                            </h2>
                            <p className="text-sm text-muted-foreground">
                                Барча ижара қайтаришлари бўйича умумий ҳисоб
                            </p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                            <div className="space-y-2 border rounded-md p-4 bg-white">
                                <div>
                                    <Label>Ҳисобланган сумма</Label>
                                    <div className="text-lg font-semibold">
                                        {(returnedProducts.reduce((total, product) => total + product.totalCost, 0) || 0).toLocaleString()} сум
                                    </div>
                                </div>

                                <div>
                                    <Label>Чегирма суммаси</Label>
                                    <Input
                                        type="number"
                                        value={totalDiscount}
                                        onChange={(e) => handleDiscountChange(e.target.value)}
                                        placeholder="Чегирма суммаси"
                                        className="mt-1"
                                    />
                                </div>

                                <div>
                                    <Label>Тўлов миқдори</Label>
                                    <div className="text-xl font-bold text-primary">
                                        {((returnedProducts.reduce((total, product) => total + product.totalCost, 0) || 0) - (totalDiscount || 0)).toLocaleString()} сум
                                    </div>
                                </div>

                                <Button
                                    className="w-full"
                                    onClick={handlePayment}
                                >
                                    Тўланган суммани сақлаш
                                </Button>

                                {returnedProducts.length > 0 && (
                                    <div className="w-full border rounded-md p-4 bg-white mb-4">
                                        {/*  button for print returned products */}
                                        <Button onClick={() => handlePrint(returnedProducts)} className="text-white hover:underline">Қайтарилган мулкларни чоп қилиш</Button>
                                        <h3 className="text-lg font-semibold mb-3">Қайтарилган Мулклар</h3>
                                        <div className="space-y-2">
                                            {returnedProducts.map((product, index) => (
                                                <div key={index}
                                                    className="flex justify-between items-center border-b pb-2">
                                                    <div>
                                                        <div className="font-medium">{product.product.name}</div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="font-semibold">
                                                            {(product.totalCost || 0).toLocaleString()} сум
                                                        </div>
                                                        <div className="text-sm text-muted-foreground">
                                                            ({(product.days || 0)} кун × {(product.quantity || 0)} дона × {((product.dailyRate || 0) || 0).toLocaleString()} сум)
                                                        </div>
                                                        <div className="text-sm text-muted-foreground">
                                                            Чегирма: {((product.discount || 0) || 0).toLocaleString()} сум
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {calculateAllCurrentReturnTotal(localRentals) > 0 && (
                                    <div className="text-base text-muted-foreground">
                                        Жорий қайтариш: {(calculateAllCurrentReturnTotal(localRentals) || 0).toLocaleString()} сум
                                    </div>
                                )}
                            </div>
                            {calculateAllCurrentReturnTotal(localRentals) > 0 && (
                                <div className="text-base text-muted-foreground">
                                    Жорий қайтариш: {(calculateAllCurrentReturnTotal(localRentals) || 0).toLocaleString()} сум
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="space-y-2">
                            <div className="flex items-center gap-4">
                                <h2 className="text-2xl font-bold">{selectedCustomer.customer.name}</h2>
                                <Badge variant={selectedCustomer.customer.status}>
                                    {selectedCustomer.customer.status}
                                </Badge>
                            </div>
                            <p className="text-muted-foreground">{selectedCustomer.customer.phone}</p>
                            <div className="flex items-center gap-4">
                                <Badge variant={calculateCustomerBalance(selectedCustomer.rentals) > 0 ? "destructive" : "success"}>
                                    Баланс: {(selectedCustomer.customer.balance || 0).toLocaleString()} сум
                                </Badge>
                                <Badge variant="outline">
                                    Фаол ижара: {selectedCustomer.totalRentals}
                                </Badge>
                                <Badge variant="outline">
                                    Жорий қайтариш: {selectedCustomer.unreturnedProducts} дона
                                </Badge>
                            </div>
                        </div>

                        <Button
                            variant="outline"
                            onClick={() => setSelectedCustomer(null)}
                        >
                            Орқага
                        </Button>
                    </div>

                    {selectedCustomer.rentals.map((rental) => (
                        <Card key={rental._id} className="p-6">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="text-lg font-semibold">
                                        Ижара #{rental.rentalNumber}
                                    </h3>
                                    <h2>
                                        Олиш санаси: {new Date(rental.createdAt).toLocaleDateString()}
                                    </h2>
                                    <p className="text-sm text-muted-foreground">
                                        Иш бошланиш санаси: {new Date(rental.workStartDate).toLocaleDateString()}
                                    </p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-2">
                                        <Label>Чегирма кунлар:</Label>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                onClick={() => {
                                                    const currentValue = discountDays[rental._id] || 0;
                                                    if (currentValue > 0) {
                                                        handleDiscountDaysChange(rental._id, currentValue - 1);
                                                    }
                                                }}
                                                disabled={!discountDays[rental._id]}
                                            >
                                                -
                                            </Button>
                                            <Input
                                                type="number"
                                                value={discountDays[rental._id] || 0}
                                                onChange={(e) => handleDiscountDaysChange(
                                                    rental._id,
                                                    parseInt(e.target.value)
                                                )}
                                                min="0"
                                                className="w-20 text-center"
                                            />
                                            <Button
                                                variant="outline"
                                                size="icon"
                                                onClick={() => {
                                                    const currentValue = discountDays[rental._id] || 0;
                                                    handleDiscountDaysChange(rental._id, currentValue + 1);
                                                }}
                                            >
                                                +
                                            </Button>
                                        </div>
                                    </div>

                                </div>
                            </div>

                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Мулк</TableHead>
                                        <TableHead>Иш бошлаш санаси</TableHead>
                                        <TableHead>Қайтариш санаси</TableHead>
                                        <TableHead>Жами кунлар</TableHead>
                                        <TableHead>Чегирма кунлар</TableHead>
                                        <TableHead>Кунлар</TableHead>
                                        <TableHead>Кунлик нарх</TableHead>
                                        <TableHead>Микдор</TableHead>
                                        <TableHead>Қайтариш</TableHead>
                                        <TableHead>Қолдиқ</TableHead>
                                        <TableHead>Қайтариш</TableHead>
                                        <TableHead>Сумма</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {rental.borrowedProducts.map((prod) => {
                                        if (!prod.product?._id) return null;

                                        // Get all returned quantities for this product
                                        const returnedQuantity = (selectedCustomer?.rentals || [])
                                            .flatMap(r => r.returnedProducts || [])
                                            .filter(rp => rp.product?._id?.toString() === prod.product._id.toString())
                                            .reduce((sum, rp) => sum + (rp.quantity || 0), 0);

                                        // Joriy qaytarish miqdorini hisoblash
                                        const currentReturnQuantity = Number(returnQuantities[`${rental._id}-${prod.product._id}`]) || 0;

                                        // Natijani ko'rsatish
                                        const totalReturnedQuantity = returnedQuantity

                                        // Hide if all items are returned
                                        if (totalReturnedQuantity >= prod.quantity) return null;

                                        const remainingQuantity = Math.max(0, prod.quantity - totalReturnedQuantity);
                                        const key = `${rental._id}-${prod.product._id}`;

                                        // Calculate days
                                        const returnDate = returnDates[key] || new Date().toISOString().split('T')[0];
                                        const { days, totalDays } = calculateDays(
                                            rental.workStartDate,
                                            returnDate,
                                            discountDays[rental._id] || 0
                                        );

                                        // Calculate total cost
                                        const totalCost = calculateProductCost(
                                            prod,
                                            totalDays,
                                            currentReturnQuantity
                                        );

                                        return (
                                            <TableRow key={prod.product._id}>
                                                <TableCell>
                                                    <div>
                                                        <span className="font-medium">
                                                            {prod.product.name}
                                                            {prod.product.type === 'combo' && (
                                                                <Badge variant="secondary" className="ml-2">
                                                                    Тўплам
                                                                </Badge>
                                                            )}
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    {new Date(rental.workStartDate).toLocaleDateString()}
                                                </TableCell>
                                                <TableCell>
                                                    <Input
                                                        type="date"
                                                        value={returnDates[key] || new Date().toISOString().split('T')[0]}
                                                        onChange={(e) => handleReturnDateChange(
                                                            rental._id,
                                                            prod.product._id,
                                                            e.target.value
                                                        )}
                                                        min={new Date(rental.workStartDate).toISOString().split('T')[0]}
                                                        className="w-40"
                                                    />
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    {(days || 0)}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">

                                                        <Input
                                                            type="number"
                                                            value={discountDays[rental._id] || 0}
                                                            onChange={(e) => handleDiscountDaysChange(
                                                                rental._id,
                                                                parseInt(e.target.value)
                                                            )}
                                                            min="0"
                                                            className="w-20 text-center"
                                                        />

                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    {(totalDays || 0)}
                                                </TableCell>
                                                <TableCell>
                                                    {((prod.dailyRate || 0) || 0).toLocaleString()} сум
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    {(prod.quantity || 0)}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    {(() => {
                                                        // Qaytarilgan miqdorni hisoblash
                                                        const returnedQuantity = (selectedCustomer?.rentals || [])
                                                            .flatMap(r => r.returnedProducts || [])
                                                            .filter(rp => rp.product?._id?.toString() === prod.product._id.toString())
                                                            .reduce((sum, rp) => sum + (rp.quantity || 0), 0);

                                                        // Jorий qaytarish miqdorini hisoblash
                                                        const currentReturnQuantity = Number(returnQuantities[`${rental._id}-${prod.product._id}`]) || 0;

                                                        // Natijani ko'rsatish
                                                        return (
                                                            <>
                                                                {returnedQuantity || 0}
                                                                {currentReturnQuantity > 0 && ` (+${currentReturnQuantity})`}
                                                            </>
                                                        );
                                                    })()}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    {(remainingQuantity)}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex items-center gap-2">
                                                        <Button
                                                            variant="outline"
                                                            size="icon"
                                                            onClick={() => {
                                                                const currentValue = returnQuantities[key] || 0;
                                                                if (currentValue > 0) {
                                                                    handleReturnQuantityChange(
                                                                        rental._id,
                                                                        prod.product._id,
                                                                        currentValue - 1,
                                                                        remainingQuantity
                                                                    );
                                                                }
                                                            }}
                                                            disabled={!(returnQuantities[key] > 0)}
                                                        >
                                                            -
                                                        </Button>
                                                        <Input
                                                            type="number"
                                                            value={returnQuantities[key] || 0}
                                                            onChange={(e) => {
                                                                const newValue = Math.max(0, parseInt(e.target.value) || 0);
                                                                handleReturnQuantityChange(
                                                                    rental._id,
                                                                    prod.product._id,
                                                                    newValue,
                                                                    remainingQuantity
                                                                );
                                                            }}
                                                            min="0"
                                                            max={remainingQuantity}
                                                            className="w-20 text-center"
                                                        />
                                                        <Button
                                                            variant="outline"
                                                            size="icon"
                                                            onClick={() => {
                                                                const currentValue = returnQuantities[key] || 0;
                                                                if (currentValue <= remainingQuantity) {
                                                                    handleReturnQuantityChange(
                                                                        rental._id,
                                                                        prod.product._id,
                                                                        currentValue + 1,
                                                                        remainingQuantity
                                                                    );
                                                                }
                                                            }}
                                                            disabled={returnQuantities[key] >= remainingQuantity}
                                                        >
                                                            +
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            onClick={() => handleReturn(rental, prod)}
                                                            disabled={!returnQuantities[key]}
                                                        >
                                                            Қайтариш
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col">
                                                        <span className="font-medium">
                                                            {(totalCost || 0).toLocaleString()} сум
                                                        </span>
                                                        <span className="text-sm text-muted-foreground">
                                                            ({(totalDays || 0)} kun × {(currentReturnQuantity || 0)} дона × {((prod.dailyRate || 0) || 0).toLocaleString()} сўм)
                                                        </span>
                                                    </div>
                                                </TableCell>
                                            </TableRow>

                                        );
                                    })}
                                </TableBody>

                            </Table>
                            {rental.description && (
                                <div className="mt-4 bg-yellow-200 rounded-lg p-4">
                                    <p className="font-medium">Қўшимча маълумот</p>
                                    <p>{rental.description}</p>
                                </div>
                            )}
                        </Card>
                    ))}
                </div>
            )}
        </div>
    );
}