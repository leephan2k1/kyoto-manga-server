import faunadb from 'faunadb';
const faunaKey = process.env.FAUNADB_SECRET_KEY as string;

export const PORT = Number(process.env.PORT) || 5050;

export const faunaClient = new faunadb.Client({
    secret: faunaKey,
    domain: 'db.fauna.com',
});
