import Contact from "../models/Contact.js"
import asyncHandler from "express-async-handler"
import path from "path"
import fs from "fs"

const getContact = asyncHandler( async(req, res) => {
    try {
        const contact = await Contact.findOne();

        res.json(contact);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
})

const getWhatsappNumber = asyncHandler(async (req, res) => {
    try {
        // Cari satu dokumen dan return hanya field 'whatsapp_number'
        const contact = await Contact.findOne({}, { whatsapp_number: 1, _id: 0 });

        res.json(contact);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

const getContactById = asyncHandler( async(req, res) => {
    const { id } = req.params

    try {
        const contact = await Contact.findById(id)

        return res.status(200).json(contact)
    } catch (error) {
        return res.status(400).json({ message: error.message})
    }
})

const createContact = asyncHandler( async(req, res) => {
    const { company_name, description, whatsapp_number, email, address, latitude, longitude } = req.body;

    if (!company_name) return res.status(400).json({ message: "Company name is required." });
    if (!description) return res.status(400).json({ message: "Description is required." });
    if (!whatsapp_number) return res.status(400).json({ message: "Whatsapp Number is required." });
    if (!email) return res.status(400).json({ message: "Email is required." });
    if (!address) return res.status(400).json({ message: "Address is required." }); 
    if (!latitude) return res.status(400).json({ message: "Latitude is required." });
    if (!longitude) return res.status(400).json({ message: "Longitude is required." });

    // Validasi apakah file di-upload
    if (req.files === null) return res.status(400).json({ message: "No file uploaded." });

    const file = req.files.file;
    const fileSize = file.data.length;
    const extention = path.extname(file.name);
    const currentDateTime = new Date();
    const timestamp = currentDateTime.toISOString().replace(/[-:]/g, "").replace("T", "").split(".")[0];
    const fileName = file.md5 + timestamp + extention; // convert to md5
    const url = `${req.protocol}://${req.get("host")}/images/${fileName}`;

    const allowedType = [".png", ".jpg", ".jpeg", ".webp"];

    // Validasi ekstensi file
    if (!allowedType.includes(extention.toLocaleLowerCase())) return res.status(422).json({ message: "Invalid images." });

    // Validasi ukuran file
    if (fileSize > (3200 * 5000)) return res.status(422).json({ message: "Image must be less than 16MB." });

    // Pindahkan file ke direktori tujuan
    file.mv(`./public/images/${fileName}`, async (error) => {
        if (error) return res.status(500).json({ message: error.message });

        try {
            const newContact = await Contact.create({
                company_name,
                description,
                image: fileName, // Gunakan nilai fileName untuk properti image
                img_url: url, // Gunakan nilai url untuk properti img_url
                whatsapp_number,
                email,
                address,
                location: {
                    type: 'Point',
                    coordinates: [parseFloat(latitude), parseFloat(longitude)]
                }
            });

            res.status(201).json({ message: "Contact created successfully.", data: newContact });
        } catch (error) {
            res.status(400).json({ message: error.message });
        }
    });
});

const updateContact = asyncHandler( async(req, res) => {
    const { id } = req.params
    const { company_name, description, whatsapp_number, email, address, latitude, longitude } = req.body;

    if (!company_name) return res.status(400).json({ message: "Company name is required." });
    if (!description) return res.status(400).json({ message: "Description is required." });
    if (!whatsapp_number) return res.status(400).json({ message: "Whatsapp Number is required." });
    if (!email) return res.status(400).json({ message: "Email is required." });
    if (!address) return res.status(400).json({ message: "Address is required." }); 
    if (!latitude) return res.status(400).json({ message: "Latitude is required." });
    if (!longitude) return res.status(400).json({ message: "Longitude is required." });

    // Confirm contact exists to delete 
    const contact = await Contact.findOne({})

    if (!contact) return res.status(404).json({ message: "No data found." })

    let fileName
    if (req.files === null) {
        fileName = contact.image
    } else {
        const file = req.files.file
        const fileSize = file.data.length
        const extention = path.extname(file.name)
        const currentDateTime = new Date();
        const timestamp = currentDateTime.toISOString().replace(/[-:]/g, "").replace("T", "").split(".")[0];
        fileName = file.md5 + timestamp + extention // convert to md5

        const allowedType = [".png", ".jpg", ".jpeg", ".webp"]
        
        if (!allowedType.includes(extention.toLocaleLowerCase())) return res.status(422).json({ message: "Invalid images." })

        if (fileSize > (3200 * 5000)) return res.status(422).json({ message: "Image must be less than 16MB." })

        const filePath = `./public/images/${contact.image}`
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        file.mv(`./public/images/${fileName}`, (error) => {
            if (error) return res.status(500).json({ message: error.message })
        })
    }

    const url = `${req.protocol}://${req.get("host")}/images/${fileName}`

    try {
        contact.company_name = company_name;
        contact.description = description;
        contact.image = fileName;
        contact.img_url = url;
        contact.whatsapp_number = whatsapp_number;
        contact.email = email;
        contact.address = address;
        contact.location = {
            type: 'Point',
            coordinates: [parseFloat(latitude), parseFloat(longitude)]
        };

        await contact.save();

        return res.status(200).json({ message: "Contact updated successfully." })
    } catch (error) {
        return res.status(400).json({ message: error.message })
    }
})

const deleteContact = asyncHandler( async(req, res) => {
    
    const contact = await Contact.findOne({})

    if (!contact) return res.status(404).json({ message: "No data found." })

    try {
        const filePath = `./public/images/${contact.image}`
        fs.unlinkSync(filePath)

        await contact.deleteOne()
        res.status(200).json({ message: "Contact deleted successfully."})
    } catch (error) {
        return res.status(400).json({ message: error.message })
    }
})

export {
    getContact,
    getWhatsappNumber,
    getContactById,
    createContact,
    updateContact,
    deleteContact
}