import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
import mongoose from 'mongoose';

dotenv.config();

const mongodbRemoteURI = process.env.MONGODB_URI as string;
const mongodbRemoteAuthURI = process.env.MONGODB_AUTH_URI as string;
const cloudinaryApiKey = process.env.CLOUDINARY_API_KEY as string;
const cloudinarySecretKey = process.env.CLOUDINARY_SECRET_KEY as string;

export const NtURL = process.env.NT_SOURCE_URL as string;
export const NtFbURL = process.env.NT_SOURCE_FALLBACK_URL as string;
export const LhURL = process.env.LH_SOURCE_URL as string;
export const OtkUrl = process.env.OTK_SOURCE_URL as string;

export const AdminId = process.env.ADMIN_ID as string;

export const PORT = Number(process.env.PORT) || 5050;

export const mongoDbRemoteClient = mongoose.createConnection(mongodbRemoteURI, {
    dbName: 'kyoto-manga-db',
});

export const mongoDbRemoteAuthClient =
    mongoose.createConnection(mongodbRemoteAuthURI);

cloudinary.config({
    cloud_name: 'dmncglvra',
    api_key: cloudinaryApiKey,
    api_secret: cloudinarySecretKey,
    secure: true,
});

export const cloudinaryClient = cloudinary;
