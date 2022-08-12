import { FastifyReply, FastifyRequest } from 'fastify';
import Chapter from '../models/Chapter.model';
import Comic from '../models/Comic.model';
import ComicsCenter from '../models';
import { Source_Type, Comic_Chapters } from 'types';

const { getChapter } = ComicsCenter();

interface ChapterParams {
    comicSlug: string;
}

export default function chaptersController() {
    return {
        handleGetChapter: async function (
            req: FastifyRequest,
            rep: FastifyReply,
        ) {
            const { comicSlug } = req.params as ChapterParams;

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

                await Chapter.updateOne(
                    {
                        comicName: chapters.comicName,
                    },
                    chapters,
                    { upsert: true },
                );

                return rep.status(201).send({
                    message: 'chapters were inserted',
                    chapters,
                });
            }

            return rep.status(200).send({
                message: 'chapters are the latest',
            });
        },
    };
}
