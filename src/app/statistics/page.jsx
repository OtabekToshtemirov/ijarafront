'use client';
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
    fetchDailyRevenue,
    fetchWeeklyRevenue,
    fetchMonthlyRevenue,
    fetchYearlyRevenue,
    fetchTopCustomers,
    fetchMostRentedCars,
} from '@/lib/features/statistics/statisticsSlice';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

export default function StatisticsPage() {
    const dispatch = useDispatch();
    const {
        dailyRevenue,
        weeklyRevenue,
        monthlyRevenue,
        yearlyRevenue,
        topCustomers,
        mostRentedCars,
    } = useSelector((state) => state.statistics);

    useEffect(() => {
        dispatch(fetchDailyRevenue());
        dispatch(fetchWeeklyRevenue());
        dispatch(fetchMonthlyRevenue());
        dispatch(fetchYearlyRevenue());
        dispatch(fetchTopCustomers());
        dispatch(fetchMostRentedCars());
    }, [dispatch]);

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
        }).format(amount);
    };

    const StatCard = ({ title, data, loading, error }) => (
        <Card className="col-span-1">
            <CardHeader>
                <CardTitle className="text-lg font-semibold">{title}</CardTitle>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="flex items-center justify-center">
                        <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                ) : error ? (
                    <p className="text-red-500">Error loading data</p>
                ) : (
                    <div className="text-2xl font-bold">
                        {data?.stats?.totalAmount
                            ? formatCurrency(data.stats.totalAmount)
                            : 'No data'}
                    </div>
                )}
            </CardContent>
        </Card>
    );

    const CustomerCard = ({ customer, index }) => (
        <div className="flex items-center justify-between p-4 bg-white rounded-lg shadow mb-2">
            <div className="flex items-center space-x-4">
                <div className="w-8 h-8 flex items-center justify-center bg-primary/10 rounded-full">
                    {index + 1}
                </div>
                <div>
                    <p className="font-semibold">{customer.customerName}</p>
                    <p className="text-sm text-gray-500">{customer.customerPhone}</p>
                </div>
            </div>
            <div className="text-right">
                <p className="font-semibold">{formatCurrency(customer.totalAmount)}</p>
                <p className="text-sm text-gray-500">{customer.paymentCount} payments</p>
            </div>
        </div>
    );

    const CarCard = ({ car, index }) => (
        <div className="flex items-center justify-between p-4 bg-white rounded-lg shadow mb-2">
            <div className="flex items-center space-x-4">
                <div className="w-8 h-8 flex items-center justify-center bg-primary/10 rounded-full">
                    {index + 1}
                </div>
                <div>
                    <p className="font-semibold">{car.driverName}</p>
                    <div className="flex flex-col">
                        <p className="text-sm text-gray-500">Car: {car.carNumber}</p>
                        <p className="text-sm text-gray-500">Phone: {car.driverPhone}</p>
                    </div>
                </div>
            </div>
            <div className="text-right">
                <p className="font-semibold">{car.rentalCount} rentals</p>
            </div>
        </div>
    );

    return (
        <div className="container mx-auto p-6 space-y-6">
            <h1 className="text-3xl font-bold mb-8">Statistics Dashboard</h1>

            {/* Revenue Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title="Daily Revenue"
                    data={dailyRevenue.data}
                    loading={dailyRevenue.loading}
                    error={dailyRevenue.error}
                />
                <StatCard
                    title="Weekly Revenue"
                    data={weeklyRevenue.data}
                    loading={weeklyRevenue.loading}
                    error={weeklyRevenue.error}
                />
                <StatCard
                    title="Monthly Revenue"
                    data={monthlyRevenue.data}
                    loading={monthlyRevenue.loading}
                    error={monthlyRevenue.error}
                />
                <StatCard
                    title="Yearly Revenue"
                    data={yearlyRevenue.data}
                    loading={yearlyRevenue.loading}
                    error={yearlyRevenue.error}
                />
            </div>

            {/* Top Customers and Most Rented Cars */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Top 5 Customers</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {topCustomers.loading ? (
                            <div className="flex items-center justify-center p-4">
                                <Loader2 className="h-6 w-6 animate-spin" />
                            </div>
                        ) : topCustomers.error ? (
                            <p className="text-red-500">Error loading customers</p>
                        ) : (
                            <div className="space-y-2">
                                {topCustomers.data?.map((customer, index) => (
                                    <CustomerCard
                                        key={customer._id}
                                        customer={customer}
                                        index={index}
                                    />
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Most Rented Cars</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {mostRentedCars.loading ? (
                            <div className="flex items-center justify-center p-4">
                                <Loader2 className="h-6 w-6 animate-spin" />
                            </div>
                        ) : mostRentedCars.error ? (
                            <p className="text-red-500">Error loading cars</p>
                        ) : (
                            <div className="space-y-2">
                                {mostRentedCars.data?.map((car, index) => (
                                    <CarCard
                                        key={car._id}
                                        car={car}
                                        index={index}
                                    />
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}