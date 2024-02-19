import Post from "../models/Post.js"
import User from "../models/User.js"
import asyncHandler from "express-async-handler"
import path from "path"
import fs from "fs"
import Category from "../models/Category.js"
import Tag from "../models/Tag.js"

const getPosts = asyncHandler( async(req, res) => {
    const search = req.query.search || "";
    const page = parseInt(req.query.page) || 0;
    const limit = parseInt(req.query.limit) || 10;

    try {
        const users = await User.find({
            $or: [
                { "name": { $regex: search, $options: "i" } },
                { "username": { $regex: search, $options: "i" } },
                { "email": { $regex: search, $options: "i" } },
            ]
        }).select("_id")

        const categories = await Category.find({
            $or: [
                { "name": { $regex: search, $options: "i" } },
                { "text": { $regex: search, $options: "i" } },
                { "image": { $regex: search, $options: "i" } },
            ]
        }).select("_id")

        const tags = await Tag.find({
            $or: [
                { "name": { $regex: search, $options: "i" } },
            ]
        }).select("_id")

        const query = {
            $or: [
                { user: { $in: users } },
                { category: { $in: categories } },
                { tags: { $in: tags } },
                { "title": { $regex: search, $options: "i" } },
                { "text": { $regex: search, $options: "i" } },
                { "image": { $regex: search, $options: "i" } }
            ]
        };

        const posts = await Post.find(query)
        .populate("author", "-_id -password")
        .populate("category", "-_id -createdAt -updatedAt")
        .populate("tags", "-_id -createdAt -updatedAt")
        .skip(limit * page)
        .sort({ createdAt: "desc" })
        .limit(limit)

        const totalRows = await Post.countDocuments(query)

        // Menghitung totalPage berdasarkan totalRows dan limit
        const totalPage = Math.ceil(totalRows/limit);

        if (posts.length === 0) {
            return res.status(200).json({ message: "No found post." });
        }

        return res.status(200).json({ result: posts, page, totalRows, totalPage });
    } catch (error) {
        console.error("Error fetching posts:", error.message);
        res.status(500).json({ message: "Internal server error." });
    }
})

const createPost = asyncHandler( async(req, res) => {
    const { title, text, username, category } = req.body
    const tags = req.body['tags[]']

    if (!title) return res.status(400).json({ message: "Title is required." })
    if (!text) return res.status(400).json({ message: "Text is required." })
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

        const allowedType = [".png", ".jpg", ".jpeg"]

        if (!allowedType.includes(extention.toLocaleLowerCase())) return res.status(422).json({ message: "Invalid images! image must an '.png', .jpg', .'jpeg' only." })

        if (fileSize > (3200 * 5000)) return res.status(422).json({ message: "Image must be less than 16MB." })

        file.mv(`./public/images/${fileName}`, async(error) => {
            if (error) return res.status(500).json({ message: error.message })

            try {
                const savedPost = await Post.create({ title, text, image: fileName, img_url: url, author: user, category, tags })
        
                // Jika category tersedia, tambahkan post ke category
                await Category.findByIdAndUpdate(
                    { _id: category },
                    { $push: { posts: savedPost._id } }
                );

                // Jika tags tersedia, tambahkan tags ke post
                if (tags && tags.length > 0) {
                    await Tag.updateMany(
                        { _id: { $in: tags } }, // Temukan tag berdasarkan ID yang ada dalam array tags
                        { $push: { posts: savedPost._id } } // Tambahkan ID post baru ke dalam array posts di setiap tag yang sesuai
                    );
                }

                return res.status(201).json({ message: "Post created successfully." })
            } catch (error) {
                console.log(error.message)
            }
        })
    } catch (error) {
        return res.status(400).json({ message: error.message })
    }
    
})

const getPostById = asyncHandler( async(req, res) => {
    const { id } = req.params

    try {
        const post = await Post.findById(id)
            .populate("author", "-_id -password")
            .populate("category", "-createdAt -updatedAt")
            .populate("tags", "-createdAt -updatedAt")

        return res.status(200).json(post)
    } catch (error) {
        return res.status(400).json({ message: error.message})
    }
})

const updatePost = asyncHandler( async(req, res) => {
    const { id } = req.params
    const { title, text, category } = req.body
    const tags = req.body['tags[]']

    console.log("category", category)

    if (!id) return res.status(400).json({ message: "Post id required." })
    if (!title) return res.status(400).json({ message: "Title is required." })
    if (!text) return res.status(400).json({ message: "Text is required." })
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

    const post = await Post.findById(id)
    if (!post) return res.status(404).json({ message: "No data found." })

    let fileName
    if (req.files === null) {
        fileName = post.image
    } else {
        const file = req.files.file
        const fileSize = file.data.length
        const extention = path.extname(file.name)
        const currentDateTime = new Date();
        const timestamp = currentDateTime.toISOString().replace(/[-:]/g, "").replace("T", "").split(".")[0];
        fileName = file.md5 + timestamp + post.user + extention // convert to md5

        const allowedType = [".png", ".jpg", ".jpeg"]
        
        if (!allowedType.includes(extention.toLocaleLowerCase())) return res.status(422).json({ message: "Invalid images." })

        if (fileSize > (3200 * 5000)) return res.status(422).json({ message: "Image must be less than 16MB." })

        const filePath = `./public/images/${post.image}`
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        file.mv(`./public/images/${fileName}`, (error) => {
            if (error) return res.status(500).json({ message: error.message })
        })
    }

    const url = `${req.protocol}://${req.get("host")}/images/${fileName}`

    try {
        // Memperbarui data post (judul, teks, gambar, dll.)
        post.title = title;
        post.text = text;
        post.image = fileName;
        post.img_url = url;

        // Jika ada perubahan pada kategori
        if (category !== post.category) {
            // Menghapus post dari kategori lama jika ada
            if (post.category) {
                const oldCategory = await Category.findById(post.category);
                if (oldCategory) {
                    oldCategory.posts = oldCategory.posts.filter(post => post.toString() !== id);
                    await oldCategory.save();
                }
            }
            
            // Menambahkan post ke kategori baru
            const newCategory = await Category.findById(category);
            if (!newCategory) {
                throw new Error("New category not found");
            }
            newCategory.posts.push(post._id);
            await newCategory.save();

            // Memperbarui kategori post
            post.category = category;
        }

        // Jika ada perubahan pada tags
        if (tags !== post.tags) {
            // Menghapus post dari tags lama jika ada
            for (const oldTagId of post.tags) {
                const oldTag = await Tag.findById(oldTagId);
                if (oldTag) {
                    oldTag.posts = oldTag.posts.filter(post => post.toString() !== id);
                    await oldTag.save();
                }
            }

            // Menambahkan post ke tags baru
            for (const newTagId of tags) {
                const newTag = await Tag.findById(newTagId);
                if (!newTag) {
                    throw new Error(`New tag with ID ${newTagId} not found`);
                }
                newTag.posts.push(post._id);
                await newTag.save();
            }

            // Memperbarui tags post
            post.tags = tags;
        }

        // Menyimpan perubahan pada post
        await post.save();

        return res.status(200).json({ message: "Post updated successfully." })
    } catch (error) {
        return res.status(400).json({ message: error.message })
    }
})

const deletePost = asyncHandler( async(req, res) => {
    const { id } = req.params

    if (!id) return res.status(400).json({ message: "Post id required." })

    const post = await Post.findById(id)
    if (!post) return res.status(404).json({ message: "No data found." })

    // Menghapus referensi dari kategori jika ada
    if (post.category) {
        const category = await Category.findById(post.category);
        if (category) {
            category.posts = category.posts.filter(post => post.toString() !== id);
            await category.save();
        }
    }

    // Menghapus referensi dari tags jika ada
    for (const tagId of post.tags) {
        const tag = await Tag.findById(tagId);
        if (tag) {
            tag.posts = tag.posts.filter(post => post.toString() !== id);
            await tag.save();
        }
    }

    try {
        const filePath = `./public/images/${post.image}`
        fs.unlinkSync(filePath)

        await post.deleteOne()

        res.status(200).json({ message: "Post deleted successfully."})
    } catch (error) {
        return res.status(400).json({ message: error.message })
    }
})

export {
    getPosts,
    getPostById,
    createPost,
    updatePost,
    deletePost
}