'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Bar, BarChart, Line, LineChart, ResponsiveContainer, XAxis, YAxis } from "recharts"
import { Package, Users, CreditCard } from "lucide-react"

// Mock data
const productRentals = [
    { name: "Bike", count: 150 },
    { name: "Camera", count: 120 },
    { name: "Tent", count: 100 },
    { name: "Surfboard", count: 80 },
    { name: "Kayak", count: 60 },
]

const customerRentals = [
    { month: "Jan", count: 65 },
    { month: "Feb", count: 75 },
    { month: "Mar", count: 100 },
    { month: "Apr", count: 120 },
    { month: "May", count: 150 },
    { month: "Jun", count: 180 },
]

const paymentsData = [
    { month: "Jan", amount: 5000 },
    { month: "Feb", amount: 6000 },
    { month: "Mar", amount: 7500 },
    { month: "Apr", amount: 9000 },
    { month: "May", amount: 11000 },
    { month: "Jun", amount: 13000 },
]

export default function StatisticsPage() {
    return (
        <div className="min-h-screen bg-gray-100 p-8">
            <header className="mb-8">
                <h1 className="text-4xl font-bold text-gray-900">Rental App Statistics</h1>
            </header>

            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                {/* Products Section */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Total Products Rented
                        </CardTitle>
                        <Package className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{productRentals.reduce((sum, product) => sum + product.count, 0)}</div>
                        <p className="text-xs text-muted-foreground">
                            Across {productRentals.length} product categories
                        </p>
                        <div className="h-[200px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={productRentals}>
                                    <XAxis dataKey="name" />
                                    <YAxis />
                                    <Bar dataKey="count" fill="#8884d8" />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Customers Section */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Customer Rentals
                        </CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{customerRentals.reduce((sum, month) => sum + month.count, 0)}</div>
                        <p className="text-xs text-muted-foreground">
                            Total rentals in the last 6 months
                        </p>
                        <div className="h-[200px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={customerRentals}>
                                    <XAxis dataKey="month" />
                                    <YAxis />
                                    <Line type="monotone" dataKey="count" stroke="#8884d8" />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Payments Section */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">
                            Total Payments
                        </CardTitle>
                        <CreditCard className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            ${paymentsData.reduce((sum, month) => sum + month.amount, 0).toLocaleString()}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            Total payments received in the last 6 months
                        </p>
                        <div className="h-[200px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={paymentsData}>
                                    <XAxis dataKey="month" />
                                    <YAxis />
                                    <Line type="monotone" dataKey="amount" stroke="#82ca9d" />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}