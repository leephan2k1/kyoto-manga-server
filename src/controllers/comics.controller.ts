import { FastifyReply, FastifyRequest } from 'fastify';
import { LhURL, OtkUrl } from '../configs';
import Comic from '../models/Comic.model';
import lhModel from '../models/Lh.model';
import NtcModel from '../models/Ntc.model';
import OTKModel from '../models/Otk.model';
import RTComic from '../models/RealTimeComic.model';
import {
    insertNewComic,
    updateSeasonalComics,
} from '../services/updateComic.service';

const Nt = NtcModel.Instance(process.env.NT_SOURCE_URL as string);
const Lh = lhModel.Instance(LhURL, 30000);
const Otk = OTKModel.Instance(OtkUrl);

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

interface ComicInfoParams {
    comicSlug: string;
}

interface QueryRandom {
    limit: number;
}

interface BodyComicSeason {
    titles: string[];
}

interface ComicPingPongUptime {
    source: string;
}

export default function comicsController() {
    return {
        handleCheckUptime: async function (
            req: FastifyRequest,
            res: FastifyReply,
        ) {
            const { source } = req.query as ComicPingPongUptime;

            try {
                switch (source) {
                    case 'NTC':
                        const [
                            checkNTSearch,
                            checkNTChapters,
                            checkNTPagesOfChap,
                        ] = await Promise.all([
                            Nt.searchQuery('Chú mèo kỳ diệu Kyuu-chan').then(
                                (result) => result,
                            ),
                            Nt.getChapters(
                                'chu-meo-ky-dieu-kyuu-chan-19558',
                            ).then((result) => result),
                            Nt.getChapterPages(
                                '/truyen-tranh/chu-meo-ky-dieu-kyuu-chan/chap-645/895104',
                            ).then((result) => result),
                        ]);

                        if (
                            checkNTSearch.mangaData.length === 0 ||
                            checkNTChapters.length === 0 ||
                            checkNTPagesOfChap.length === 0
                        ) {
                            return res.status(400).send({
                                pong: false,
                            });
                        }
                        break;

                    case 'LHM':
                        const [
                            checkLHSearch,
                            checkLHComic,
                            checkLHPagesOfChapter,
                        ] = await Promise.all([
                            Lh.search('Chú mèo kỳ diệu Kyuu-chan').then(
                                (result) => result,
                            ),
                            Lh.getComic('chu-meo-ky-dieu-kyuu-chan').then(
                                (result) => result,
                            ),
                            Lh.getChapterPages(
                                '/truyen-tranh/chu-meo-ky-dieu-kyuu-chan/187-8',
                            ),
                        ]);

                        if (
                            !checkLHSearch ||
                            !checkLHComic ||
                            checkLHPagesOfChapter.length === 0
                        ) {
                            return res.status(400).send({
                                pong: false,
                            });
                        }
                        break;

                    case 'OTK':
                        const [
                            checkOtkSearch,
                            checkOtkComic,
                            checkOtkPagesOfChapter,
                        ] = await Promise.all([
                            Otk.search('Chú mèo kỳ diệu Kyuu-chan').then(
                                (result) => result,
                            ),
                            Otk.getChapters(
                                'https://otakusan.net/manga-detail/31105/chu-meo-ky-dieu-kyuu-chan',
                            ).then((result) => result),
                            Otk.getChapterPages(
                                '/chapter/1601027/chu-meo-ky-dieu-kyuu-chan-chap-647',
                            ),
                        ]);

                        if (
                            !checkOtkSearch ||
                            checkOtkComic.length === 0 ||
                            checkOtkPagesOfChapter.length === 0
                        ) {
                            return res.status(400).send({
                                pong: false,
                            });
                        }

                        break;

                    default:
                        return res.status(400).send({ ping: false });
                }

                return res.status(200).send({
                    pong: true,
                });
            } catch (err) {
                res.status(400).send({
                    message: err,
                });
            }
        },

        handleAddManuallyComicSeason: async function (
            req: FastifyRequest,
            res: FastifyReply,
        ) {
            try {
                const { titles } = req.body as BodyComicSeason;

                //@ts-ignore
                const comics = [];

                await Promise.allSettled(
                    titles.map(async (title) => {
                        const comic = await Comic.findOne({ name: title });
                        if (comic) {
                            comics.push(comic);
                        } else {
                            await insertNewComic(title);
                            const comic = await Comic.findOne({ name: title });
                            if (comic) comics.push(comic);
                        }
                    }),
                );

                if (comics.length) {
                    await RTComic.updateOne(
                        {
                            type: 'season',
                        },
                        {
                            $push: {
                                //@ts-ignore
                                comics: { $each: comics },
                            },
                        },
                        { upsert: true },
                    );
                }

                return res.status(201).send({
                    message: 'ok',
                    length: comics.length,
                    //@ts-ignore
                    comics,
                });
            } catch (error) {
                return res.status(400).send({ message: error });
            }
        },

        handleGetSeason: async function (
            req: FastifyRequest,
            res: FastifyReply,
        ) {
            try {
                const comics = await updateSeasonalComics();

                return res.status(200).send({
                    message: 'ok',
                    // @ts-ignore
                    length: comics?.length,
                    // @ts-ignore
                    comics,
                });
            } catch (error) {
                return res.status(400).send({
                    message: error,
                });
            }
        },

        handleGetComicInfo: async function (
            req: FastifyRequest,
            res: FastifyReply,
        ) {
            const { comicSlug } = req.params as ComicInfoParams;

            try {
                const existComic = await Comic.findOne({ slug: comicSlug });

                if (existComic)
                    return res.status(200).send({
                        message: 'ok',
                        comic: existComic,
                    });

                const comic = await Nt.getComicBySlug(comicSlug);

                if (!comic)
                    return res.status(404).send({ message: 'not found' });

                if (!existComic) {
                    const result = await Comic.create(comic);

                    return res.status(201).send({
                        message: 'ok',
                        comic: result,
                    });
                }
            } catch (err) {
                return res.status(404).send({ message: 'not found' });
            }
        },

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

        handleFilters: async function (req: FastifyRequest, res: FastifyReply) {
            const { gender, genres, minChapter, page, status, top } =
                req.query as FiltersQuery;

            const result = await Nt.advancedSearch(
                genres,
                minChapter,
                top,
                page,
                status,
                gender,
            );

            res.status(200).send({
                message: 'ok',
                result,
            });
        },

        handleRandomComics: async function (
            req: FastifyRequest,
            res: FastifyReply,
        ) {
            try {
                const { limit } = req.query as QueryRandom;

                //@ts-ignore
                const comics = await Comic.aggregate([
                    { $sample: { size: limit } },
                ]);

                return res.status(200).send({
                    message: 'ok',
                    comics,
                });
            } catch (error) {
                return res.status(400).send({
                    message: error,
                });
            }
        },
    };
}
