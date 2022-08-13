import { FastifyReply, FastifyRequest } from 'fastify';

import RTComic from '../models/RealTimeComic.model';
import Comic from '../models/Comic.model';
import NtcModel from '../models/Ntc.model';
import {
    insertNewComic,
    updateNewUpdatedComic,
} from '../services/updateComic.service';

const Nt = NtcModel.Instance(process.env.NT_SOURCE_URL as string);

interface SearchQuery {
    q: string;
}

interface FiltersQuery {
    genres: number;
    gender: number;
    status: number;
    top: number;
    minChapter: number;
    page: number;
}

interface NewQuery {
    type: string;
}

export default function comicsController() {
    return {
        handleSearch: async function (req: FastifyRequest, res: FastifyReply) {
            const { q } = req.query as SearchQuery;

            try {
                let result = await Comic.find({
                    name: {
                        $regex: q,
                        $options: 'i',
                    },
                });

                /* If the result is empty, it will search the query in the Nt source. */
                /* working like a cache */
                if (result.length === 0) {
                    console.log('search miss!');
                    //@ts-ignore
                    result = await insertNewComic(q);
                }

                res.status(200).send({
                    message: 'ok',
                    result,
                });
            } catch (err) {
                console.log(`error search controller: ${err}`);

                res.status(404).send({
                    message: 'search not found',
                });
            }
        },

        handleGetNew: async function (req: FastifyRequest, res: FastifyReply) {
            const { type } = req.query as NewQuery;

            const result = await RTComic.findOne({ type });

            if (result) {
                console.log('get new comics hit');
                const { comics } = result;

                return res.status(200).send({
                    message: 'ok',
                    comics,
                });
            }

            console.log('get new comics miss');
            const resultMiss = await updateNewUpdatedComic();
            //@ts-ignore
            const { comics } = resultMiss;

            if (!comics || comics.length === 0)
                return res.status(404).send({
                    message: 'not found',
                });

            return res.status(201).send({
                message: 'ok',
                comics,
            });
        },

        handleFilters: async function (req: FastifyRequest, res: FastifyReply) {
            const { gender, genres, minChapter, page, status, top } =
                req.query as FiltersQuery;

            res.status(200).send(req.query);
        },
    };
}
