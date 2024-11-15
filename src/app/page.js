'use client'

import { useState } from "react"
import { Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

const rentals = [
    {
        customer: "Julia Smith",
        item: "Bike 1",
        quantity: 2,
        dailyCost: 10,
        startDate: "July 7, 2023",
        endDate: "July 14, 2023",
        status: "Active",
    },
    {
        customer: "James Brown",
        item: "Surfboard 2",
        quantity: 1,
        dailyCost: 25,
        startDate: "July 4, 2023",
        endDate: "July 11, 2023",
        status: "Completed",
    },
    {
        customer: "Emma Johnson",
        item: "Skateboard 1",
        quantity: 3,
        dailyCost: 8,
        startDate: "July 1, 2023",
        endDate: "July 8, 2023",
        status: "Active",
    },
    {
        customer: "Michael Davis",
        item: "Paddleboard 1",
        quantity: 1,
        dailyCost: 20,
        startDate: "June 30, 2023",
        endDate: "July 7, 2023",
        status: "Completed",
    },
    {
        customer: "Sophia Wilson",
        item: "Snowboard 2",
        quantity: 2,
        dailyCost: 15,
        startDate: "June 27, 2023",
        endDate: "July 4, 2023",
        status: "Active",
    },
]

export default function Component() {
    const [searchTerm, setSearchTerm] = useState("")

    const filteredRentals = rentals.filter((rental) =>
        rental.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
        rental.item.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div className="container mx-auto py-10 relative w-full">
            <h1 className="text-4xl font-bold mb-8">Ijaralar</h1>

            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search rentals"
                        className="pl-8"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        aria-label="Search rentals"
                    />
                </div>
                <div className="flex gap-2">
                    <Button variant="outline">Filter</Button>
                    <Link href={'/ijara/add-rental'}
                        // design like a button
                          className="bg-background text-primary-background text-sm  px-4 py-2 rounded-lg shadow" >
                        Yaratish
                    </Link>
                </div>
            </div>

            <div className="border rounded-lg">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Mijoz</TableHead>
                            <TableHead>Mahsulot</TableHead>
                            <TableHead>Soni</TableHead>
                            <TableHead>Kunlik ijara</TableHead>
                            <TableHead>Boshlash sana</TableHead>
                            <TableHead>Tugash sana</TableHead>
                            <TableHead>Ijara statusi</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredRentals.map((rental, index) => (
                            <TableRow key={index}>
                                <TableCell>{rental.customer}</TableCell>
                                <TableCell>{rental.item}</TableCell>
                                <TableCell>{rental.quantity}</TableCell>
                                <TableCell>${rental.dailyCost}</TableCell>
                                <TableCell>{rental.startDate}</TableCell>
                                <TableCell>{rental.endDate}</TableCell>
                                <TableCell>
                                    <Badge
                                        variant={rental.status === "Active" ? "default" : "secondary"}
                                    >
                                        {rental.status}
                                    </Badge>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
            {filteredRentals.length === 0 && (
                <p className="text-center text-muted-foreground mt-4">No rentals found.</p>
            )}
        </div>
    )
}