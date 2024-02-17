import Menu from "../models/Menu.js";
import asyncHandler from "express-async-handler";

export const getMenus = asyncHandler(async (req, res) => {
    const search = req.query.search || "";
    const page = parseInt(req.query.page) || 0;
    const limit = parseInt(req.query.limit) || 32;

    try {
        const menus = await Menu.find({
            $or: [
                { "name": { $regex: search, $options: "i" } },
                { "link": { $regex: search, $options: "i" } },
                { "icon": { $regex: search, $options: "i" } },
            ]
        })
        .skip(limit * page)
        .select("-createdAt -updatedAt")
        .sort({ "createdAt": "asc" })
        .limit(limit)

        const totalRows = await Menu.countDocuments({
            $or: [
                { "name": { $regex: search, $options: "i" } },
                { "link": { $regex: search, $options: "i" } },
                { "icon": { $regex: search, $options: "i" } },
            ]
        })

        // Menghitung totalPage berdasarkan totalRows dan limit
        const totalPage = Math.ceil(totalRows/limit);

        if (menus.length === 0) {
            return res.status(200).json({ message: "No found menu." });
        }

        return res.status(200).json({ result: menus, page, totalRows, totalPage });
    } catch (error) {
        console.error("Error fetching menus:", error.message);
        res.status(500).json({ message: "Internal server error." });
    }
});

export const createMenu = asyncHandler(async (req, res) => {
    const { name, link, icon } = req.body

    // confirm data
    // validate name
    if (!name) return res.status(400).json({ message: "Name is required." });

    // validate link
    if (!link) return res.status(400).json({ message: "Link is required." });

    // validate icon
    if (!icon) return res.status(400).json({ message: "Icon is required." });

    try {
        const menu = await Menu.create({ 
            name,
            link, 
            icon,
        })

        if (!menu) return res.status(400).json({ message: "Invalid menu data recivied." })

        return res.status(200).json({ message:  `${menu.name} created successfully.` })
    } catch (error) {
        return res.status(400).json({ message: error.message })
    }
})

export const getMenuById = asyncHandler(async (req, res) => {
    const { id } = req.params

    try {
        const menu = await Menu.findById(id)

        return res.status(200).json(menu)
    } catch (error) {
        return res.status(400).json({ message: error.message})
    }
})

export const updateMenu = asyncHandler(async (req, res) => {
    const { id } = req.params
    const { name, link, icon } = req.body

    const menu = await Menu.findById({_id: id})
    if (!menu) return res.status(400).json({ message: "No menu found." })

    if (!name) return res.status(400).json({ message: "Name is required." });

    if (!link) return res.status(400).json({ message: "Link is required." });

    // Check if icon is provided
    if (!icon) return res.status(400).json({ message: "Icon is required." });

    try {
        menu.name = name
        menu.link = link
        menu.icon = icon

        await menu.save()
        
        return res.status(200).json({ message: "Menu successfully updated." })
    } catch (error) {
        return res.status(400).json({ message: error.message })
    }
})

export const deleteMenu = asyncHandler(async (req, res) => {
    const { id } = req.params

    if (!id) return res.status(400).json({ message: "Menu id required." })

    const menu = await Menu.findById(id).exec()

    if (!menu) return res.status(404).json({ message: "Menu not found."})

    try {
        const menu = await Menu.findOneAndDelete({ _id: id })

        return res.status(200).json({ message: `Menu successfully deleted.`})
    } catch (error) {
        return res.status(400).json({ message: error.message })
    }
})