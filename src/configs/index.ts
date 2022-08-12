import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
import faunadb from 'faunadb';
import mongoose from 'mongoose';

dotenv.config();

const faunaKey = process.env.FAUNADB_SECRET_KEY as string;
const mongodbRemoteURI = process.env.MONGODB_URI as string;
const cloudinaryApiKey = process.env.CLOUDINARY_API_KEY as string;
const cloudinarySecretKey = process.env.CLOUDINARY_SECRET_KEY as string;

export const NtURL = process.env.NT_SOURCE_URL as string;
export const LhURL = process.env.LH_SOURCE_URL as string;
export const OtkUrl = process.env.OTK_SOURCE_URL as string;

export const PORT = Number(process.env.PORT) || 5050;

export const faunaClient = new faunadb.Client({
    secret: faunaKey,
    domain: 'db.fauna.com',
});

export const mongoDbRemoteClient = mongoose.createConnection(mongodbRemoteURI, {
    dbName: 'kyoto-manga-db',
});

cloudinary.config({
    cloud_name: 'dsoxko2mu',
    api_key: cloudinaryApiKey,
    api_secret: cloudinarySecretKey,
    secure: true,
});

export const cloudinaryClient = cloudinary;

export const faunaQuery = faunadb.query;
