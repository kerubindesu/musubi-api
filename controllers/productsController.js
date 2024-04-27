import Product from "../models/Product.js"
import User from "../models/User.js"
import asyncHandler from "express-async-handler"
import path from "path"
import fs from "fs"
import Category from "../models/Category.js"
import Tag from "../models/Tag.js"
import createSlug from "../utils/createSlug.js"

const getProducts = asyncHandler( async(req, res) => {
    const search = req.query.search || "";
    const page = parseInt(req.query.page) || 0;
    const limit = parseInt(req.query.limit) || 10;

    try {
        // const users = await User.find({
        //     $or: [
        //         { "name": { $regex: search, $options: "i" } },
        //         { "username": { $regex: search, $options: "i" } },
        //         { "email": { $regex: search, $options: "i" } },
        //     ]
        // }).select("_id")

        const categories = await Category.find({
            $or: [
                { "name": { $regex: search, $options: "i" } },
                // { "description": { $regex: search, $options: "i" } },
                // { "image": { $regex: search, $options: "i" } },
            ]
        }).select("_id")

        const tags = await Tag.find({
            $or: [
                { "name": { $regex: search, $options: "i" } },
            ]
        }).select("_id")

        const query = {
            $or: [
                // { user: { $in: users } },
                { category: { $in: categories } },
                { tags: { $in: tags } },
                { "title": { $regex: search, $options: "i" } },
                // { "description": { $regex: search, $options: "i" } },
                // { "image": { $regex: search, $options: "i" } }
            ]
        };

        const products = await Product.find(query)
        .populate("author", "-_id -password")
        .populate("category", "-_id -createdAt -updatedAt")
        .populate("tags", "-_id -createdAt -updatedAt")
        .skip(limit * page)
        .sort({ createdAt: "desc" })
        .limit(limit)

        const totalRows = await Product.countDocuments(query)

        // Menghitung totalPage berdasarkan totalRows dan limit
        const totalPage = Math.ceil(totalRows/limit);

        if (products.length === 0) {
            return res.status(200).json({ message: "No found product." });
        }

        return res.status(200).json({ result: products, page, totalRows, totalPage });
    } catch (error) {
        console.error("Error fetching products:", error.message);
        res.status(500).json({ message: "Internal server error." });
    }
})

const createProduct = asyncHandler( async(req, res) => {
    const { title, description, username, category } = req.body
    const slug = await createSlug(title);
    const tags = req.body['tags[]']

    if (!title) return res.status(400).json({ message: "Title is required." })
    if (!description) return res.status(400).json({ message: "Description is required." })
    if (!username) return res.status(403).json({ message: "Forbidden." })
    if (req.files === null) return res.status(400).json({ message: "No file uploaded." })
    if (!category) return res.status(400).json({ message: "Category is required." })
    if (category) {
        try {
            const result = await Category.findById({ _id: category } )
            if (!result) return res.status(404).json({ message: "Category not found." })
        } catch (error) {
            console.log(error.message)
            return res.status(400).json({ message: error.message})
        }
    }

    try {
        const user = await User.findOne({username})
        const file = req.files.file
        const fileSize = file.data.length
        const extention = path.extname(file.name)
        const currentDateTime = new Date();
        const timestamp = currentDateTime.toISOString().replace(/[-:]/g, "").replace("T", "").split(".")[0];
        const fileName = file.md5 + timestamp + user._id + extention // convert to md5
        const url = `${req.protocol}://${req.get("host")}/images/${fileName}`

        const allowedType = [".png", ".jpg", ".jpeg", ".webp"]

        if (!allowedType.includes(extention.toLocaleLowerCase())) return res.status(422).json({ message: "Invalid images! image must an '.png', .jpg', .'jpeg' only." })

        if (fileSize > (3200 * 5000)) return res.status(422).json({ message: "Image must be less than 16MB." })

        file.mv(`./public/images/${fileName}`, async(error) => {
            if (error) return res.status(500).json({ message: error.message })

            try {
                const savedProduct = await Product.create({ title, slug, description, image: fileName, img_url: url, author: user, category, tags })
        
                // Jika category tersedia, tambahkan product ke category
                await Category.findByIdAndUpdate(
                    { _id: category },
                    { $push: { products: savedProduct._id } }
                );

                // Jika tags tersedia, tambahkan tags ke product
                if (tags && tags.length > 0) {
                    await Tag.updateMany(
                        { _id: { $in: tags } }, // Temukan tag berdasarkan ID yang ada dalam array tags
                        { $push: { products: savedProduct._id } } // Tambahkan ID product baru ke dalam array products di setiap tag yang sesuai
                    );
                }

                return res.status(201).json({ message: "Product created successfully." })
            } catch (error) {
                console.log(error.message)
            }
        })
    } catch (error) {
        return res.status(400).json({ message: error.message })
    }
    
})

const getProductBySlug = asyncHandler( async(req, res) => {
    const { slug } = req.params
    
    const product = await Product.findOne({ slug })
        .populate("author", "-_id -password")
        .populate("category", "-createdAt -updatedAt")
        .populate("tags", "-createdAt -updatedAt")

    if (!product) {
        return res.status(404).json({ message: 'Product not found.' });
    } else {
        return res.status(200).json(product)
    }
})

const getProductById = asyncHandler( async(req, res) => {
    const { id } = req.params

    try {
        const product = await Product.findById(id)
            .populate("author", "-_id -password")
            .populate("category", "-createdAt -updatedAt")
            .populate("tags", "-createdAt -updatedAt")

        return res.status(200).json(product)
    } catch (error) {
        return res.status(400).json({ message: error.message})
    }
})

const updateProduct = asyncHandler( async(req, res) => {
    const { id } = req.params
    const { title, description, category } = req.body
    let slug
    let tags = req.body['tags[]']

    if (!id) return res.status(400).json({ message: "Product id is required." })
    if (!title) return res.status(400).json({ message: "Title is required." })
    if (!description) return res.status(400).json({ message: "Description is required." })
    if (!category) return res.status(400).json({ message: "Category is required." })

    if (category) {
        try {
            const result = await Category.findById({ _id: category } )
            if (!result) return res.status(404).json({ message: "Category not found." })
        } catch (error) {
            console.log(error.message)
            return res.status(400).json({ message: error.message})
        }
    }

    const product = await Product.findById(id)
    if (!product) return res.status(404).json({ message: "No data found." })

    if (title !== product.title) {
        slug = await createSlug(title)
    } else {
        slug = product.slug
    }

    let fileName
    if (req.files === null) {
        fileName = product.image
    } else {
        const file = req.files.file
        const fileSize = file.data.length
        const extention = path.extname(file.name)
        const currentDateTime = new Date();
        const timestamp = currentDateTime.toISOString().replace(/[-:]/g, "").replace("T", "").split(".")[0];
        fileName = file.md5 + timestamp + product.author + extention // convert to md5

        const allowedType = [".png", ".jpg", ".jpeg", ".webp"]
        
        if (!allowedType.includes(extention.toLocaleLowerCase())) return res.status(422).json({ message: "Invalid images." })

        if (fileSize > (3200 * 5000)) return res.status(422).json({ message: "Image must be less than 16MB." })

        const filePath = `./public/images/${product.image}`
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        file.mv(`./public/images/${fileName}`, (error) => {
            if (error) return res.status(500).json({ message: error.message })
        })
    }

    const url = `${req.protocol}://${req.get("host")}/images/${fileName}`

    try {
        // Memperbarui data product (judul, teks, gambar, dll.)
        product.title = title;
        product.slug = slug;
        product.description = description;
        product.image = fileName;
        product.img_url = url;

        // Jika ada perubahan pada kategori
        if (category !== product.category) {
            // Menghapus product dari kategori lama jika ada
            if (product.category) {
                const oldCategory = await Category.findById(product.category);
                if (oldCategory) {
                    oldCategory.products = oldCategory.products.filter(product => product.toString() !== id);
                    await oldCategory.save();
                }
            }
            
            // Menambahkan product ke kategori baru
            const newCategory = await Category.findById(category);
            if (!newCategory) {
                throw new Error("New category not found");
            }
            newCategory.products.push(product._id);
            await newCategory.save();

            // Memperbarui kategori product
            product.category = category;
        }

        // Jika ada perubahan pada tags
        if (tags !== undefined && tags !== product.tags) {
            // Menghapus product dari tags lama jika ada

            if (!Array.isArray(tags)) {
                tags = [tags];
            }
            for (const oldTagId of product.tags) {
                const oldTag = await Tag.findById(oldTagId);
                if (oldTag) {
                    oldTag.products = oldTag.products.filter(product => product.toString() !== id);
                    await oldTag.save();
                }
            }

            // Menambahkan product ke tags baru
            for (const newTagId of tags) {
                const newTag = await Tag.findById(newTagId);
                if (!newTag) {
                    throw new Error(`New tag with ID ${newTagId} not found`);
                }
                newTag.products.push(product._id);
                await newTag.save();
            }

            // Memperbarui tags product
            product.tags = tags;
        }

        // Menyimpan perubahan pada product
        await product.save();

        return res.status(200).json({ message: "Product updated successfully." })
    } catch (error) {
        return res.status(400).json({ message: error.message })
    }
})

const deleteProduct = asyncHandler( async(req, res) => {
    const { id } = req.params

    if (!id) return res.status(400).json({ message: "Product id is required." })

    const product = await Product.findById(id)
    if (!product) return res.status(404).json({ message: "No data found." })

    // Menghapus referensi dari kategori jika ada
    if (product.category) {
        const category = await Category.findById(product.category);
        if (category) {
            category.products = category.products.filter(product => product.toString() !== id);
            await category.save();
        }
    }

    // Menghapus referensi dari tags jika ada
    for (const tagId of product.tags) {
        const tag = await Tag.findById(tagId);
        if (tag) {
            tag.products = tag.products.filter(product => product.toString() !== id);
            await tag.save();
        }
    }

    try {
        const filePath = `./public/images/${product.image}`
        fs.unlinkSync(filePath)

        await product.deleteOne()

        res.status(200).json({ message: "Product deleted successfully."})
    } catch (error) {
        return res.status(400).json({ message: error.message })
    }
})

export {
    getProducts,
    getProductBySlug,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct
}