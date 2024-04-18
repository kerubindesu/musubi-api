import Product from "../models/Product.js"

// Fungsi untuk membuat slug
async function createSlug(title) {
    let slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    let isDuplicate = await isSlugDuplicate(slug);
    let counter = 1;

    while (isDuplicate) {
        slug = `${slug}-${counter}`;
        isDuplicate = await isSlugDuplicate(slug);
        counter++;
    }

    return slug;
}

// Fungsi untuk memeriksa duplikat slug
async function isSlugDuplicate(slug) {
    const existingProduct = await Product.findOne({ slug });
    return existingProduct !== null;
}

export default createSlug;
