import faunadb from 'faunadb';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const faunaKey = process.env.FAUNADB_SECRET_KEY as string;
const mongodbRemoteURI = process.env.MONGODB_URI as string;

export const PORT = Number(process.env.PORT) || 5050;

export const faunaClient = new faunadb.Client({
    secret: faunaKey,
    domain: 'db.fauna.com',
});

export const mongoDbRemoteClient = mongoose.createConnection(mongodbRemoteURI, {
    dbName: 'kyoto-manga-db',
});

export const faunaQuery = faunadb.query;
