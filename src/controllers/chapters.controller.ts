import { FastifyReply, FastifyRequest } from 'fastify';
import { Comic_Chapters, Source_Type, Chapter_Pages } from 'types';

import { LhURL, NtURL, OtkUrl } from '../configs';
import ComicsCenter from '../models';
import Chapter from '../models/Chapter.model';
import Comic from '../models/Comic.model';
import lhModel from '../models/Lh.model';
import NtcModel from '../models/Ntc.model';
import OTKModel from '../models/Otk.model';
import Page from '../models/Page.model';

const Nt = NtcModel.Instance(NtURL);
const Lh = lhModel.Instance(LhURL, 30000);
const Otk = OTKModel.Instance(OtkUrl);

const { getChapter, getPages, getMetaInfo } = ComicsCenter();

interface ChapterParams {
    comicSlug: string;
}

interface ChaptersQuery {
    options?: 'skip' | 'get';
}

interface PagesChapterBody {
    chapterSlug: string;
    source: string;
    comicName: string;
    comicSlug: string;
}

export default function chaptersController() {
    return {
        handleGetChapter: async function (
            req: FastifyRequest,
            rep: FastifyReply,
        ) {
            const { comicSlug } = req.params as ChapterParams;
            const { options } = req.query as ChaptersQuery;

            //lookup in database:
            const comic = await Comic.findOne({ slug: comicSlug });

            if (!comic) {
                return rep.status(404).send({
                    message: 'comic not yet updated',
                });
            }

            const chapters = await Chapter.findOne({ comicSlug });

            //get chapters in comic source, if exist -> compare diff
            if (chapters) {
                let newFlag = false;
                const refreshChapter = [];
                const mainChapters = await getChapter(
                    String(comic?.slug),
                    'NTC',
                );

                if (mainChapters?.length) {
                    const existChapters = chapters?.chapters_list.find(
                        (chapterObj) => chapterObj.sourceName === 'NTC',
                    );

                    if (
                        existChapters &&
                        existChapters.chapters.length < mainChapters.length
                    ) {
                        refreshChapter.push({
                            sourceName: 'NTC',
                            chapters: mainChapters,
                        });
                        newFlag = true;
                    } else {
                        refreshChapter.push(existChapters);
                    }
                }

                if (comic?.sourcesAvailable.length) {
                    await Promise.allSettled(
                        comic?.sourcesAvailable.map(async (src) => {
                            const chaptersRefresh = await getChapter(
                                String(src.sourceSlug),
                                src.sourceName as Source_Type,
                            );

                            if (chaptersRefresh?.length) {
                                const existChapters =
                                    chapters?.chapters_list.find(
                                        (chapterObj) =>
                                            chapterObj.sourceName ===
                                            src.sourceName,
                                    );

                                if (
                                    existChapters &&
                                    existChapters.chapters.length <
                                        chaptersRefresh.length
                                ) {
                                    refreshChapter.push({
                                        sourceName: src.sourceName,
                                        chapters: chaptersRefresh,
                                    });
                                    newFlag = true;
                                } else {
                                    refreshChapter.push(existChapters);
                                }
                            }
                        }),
                    );
                }

                // -> insert to db
                if (refreshChapter.length && newFlag) {
                    //@ts-ignore
                    chapters?.chapters_list = refreshChapter;
                    await chapters?.save();

                    return rep.status(201).send({
                        message: 'new chapters available',
                        chapters,
                    });
                }
            }

            //insert new chapters
            else {
                const chapters: Comic_Chapters = {
                    chapters_list: [],
                    comicName: String(comic.name),
                    comicSlug: String(comic.slug),
                    source: 'NTC',
                };

                const mainChapters = await getChapter(
                    String(comic.slug),
                    'NTC',
                );

                if (mainChapters && mainChapters.length > 0) {
                    chapters.chapters_list.push({
                        sourceName: 'NTC',
                        chapters: mainChapters,
                    });
                }

                //get chapter other source if exist:
                if (comic.sourcesAvailable?.length > 0) {
                    await Promise.allSettled(
                        //@ts-ignore
                        comic.sourcesAvailable.map(async (e) => {
                            const chaptersResult = await getChapter(
                                String(e.sourceSlug),
                                e.sourceName as Source_Type,
                            );

                            if (chaptersResult && chaptersResult.length > 0) {
                                chapters.chapters_list.push({
                                    sourceName: String(e.sourceName),
                                    chapters: chaptersResult,
                                });
                            }
                        }),
                    );
                }

                const doc = await Chapter.create(chapters);

                await Comic.updateOne(
                    { slug: comicSlug },
                    { $set: { chapters: doc._id } },
                    { upsert: true },
                );

                return rep.status(201).send({
                    message: 'chapters were inserted',
                    chapters,
                });
            }

            return rep.status(200).send({
                message: 'chapters are the latest',
                chapters: options === 'get' ? chapters : undefined,
            });
        },

        handleGetPages: async function (
            req: FastifyRequest,
            rep: FastifyReply,
        ) {
            try {
                const { chapterSlug, source } = req.body as PagesChapterBody;

                const metaInfo = await getMetaInfo(
                    chapterSlug,
                    source as Source_Type,
                );

                // const existPages = await Page.findOne({ chapterSlug });
                // if (existPages) {
                //     return rep.status(200).send({
                //         message: 'pages already exist in the database',
                //     });
                // }

                const pages = await getPages(
                    chapterSlug,
                    source as Source_Type,
                );

                // const chapter = await Chapter.findOne({ comicName });

                if (
                    pages &&
                    pages.length &&
                    metaInfo?.chapterId &&
                    metaInfo?.comicName &&
                    metaInfo?.comicSlug &&
                    metaInfo?.chapter
                ) {
                    const pagesObj: Chapter_Pages = {
                        chapterSlug,
                        comicName: metaInfo?.comicName,
                        source,
                        pages,
                        comicSlug: metaInfo?.comicSlug,
                    };

                    const pagesSaved = await Page.create({
                        ...pagesObj,
                        chapter: metaInfo?.chapterId,
                    });

                    return rep.status(201).send({
                        message: `save pages ${chapterSlug} successfully`,
                        pages: pagesSaved,
                        chapter: metaInfo?.chapter,
                    });
                }

                return rep.status(404).send({
                    message: 'not found',
                });
            } catch (err) {
                console.log('ERROR: ', err);

                return rep.status(400).send({
                    message: 'error',
                });
            }
        },
    };
}
