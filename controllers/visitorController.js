import Visit from "../models/Visit.js"
import asyncHandler from "express-async-handler"

export const getVisitsData = asyncHandler( async(req, res) => {
    try {
        // Ambil tanggal awal dan akhir dari query jika ada, atau tentukan default
        const { startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), endDate = new Date() } = req.query;
        
        // Agregasi data dari MongoDB
        const data = await Visit.aggregate([
            {
                $match: {
                    visitedAt: { $gte: new Date(startDate), $lte: new Date(endDate) }
                }
            },
            {
                $group: {
                    _id: {
                        year: { $year: "$visitedAt" },
                        month: { $month: "$visitedAt" },
                        day: { $dayOfMonth: "$visitedAt" }
                    },
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 }
            }
        ]);

        // Format data untuk memudahkan penggunaan di frontend
        const formattedData = data.map(item => ({
            date: `${item._id.day}/${item._id.month}/${item._id.year}`,
            count: item.count
        }));

        res.json(formattedData);
    } catch (error) {
        console.error("Failed to retrieve visitor data:", error);
        res.status(500).send('Error retrieving visitor data');
    }
});