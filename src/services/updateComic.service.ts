import axios from 'axios';
import { parse } from 'node-html-parser';
import logEvents from '../utils/logEvents';
import { NtURL } from '../configs';
import ComicsCenter from '../models';
import Comic from '../models/Comic.model';
import { Nt } from '../models/Ntc.model';
import RTComic from '../models/RealTimeComic.model';
import Chapter from '../models/Chapter.model';
import Page from '../models/Page.model';
import { Comic as IComic } from '../types';

const { getChapter, getPages, getComics } = ComicsCenter();

export async function insertNewComic(name: string) {
    try {
        const { mangaData } = await Nt.searchQuery(name);

        const { getComics } = ComicsCenter();

        //@ts-ignore
        const data = await getComics(mangaData);

        const pageData = data?.map((e) => {
            if (e.status === 'fulfilled') {
                return e.value;
            }
        });

        //save to mongodb:
        if (pageData && pageData.length) {
            await Promise.allSettled(
                pageData?.map(async (comic) => {
                    const existComic = await Comic.findOne({
                        name: comic?.name,
                    });

                    if (existComic) return;

                    await Comic.updateOne(
                        {
                            name: comic?.name,
                        },
                        comic,
                        { upsert: true },
                    );

                    console.log(`save ${comic?.name} sucessfully`);
                }),
            );
        }

        return mangaData;
    } catch (err) {}
}

// tim-truyen-nang-cao?genres=23&notgenres=&gender=-1&status=-1&minchapter=1&sort=10
export async function updateTopAllView() {
    try {
        const { mangaData } = await Nt.advancedSearch(23, 1, 10, 1, -1, -1);
        //@ts-ignore
        const comics = [];

        await Promise.allSettled(
            mangaData.map(async (cmc) => {
                const comicDb = await Comic.findOne({ name: cmc.name });

                if (comicDb) comics.push(comicDb);
                else {
                    const newCmc = await insertNewComic(cmc.name);
                    comics.push(newCmc);
                }
            }),
        );

        if (comics.length === 0) return;

        await RTComic.updateOne(
            {
                type: 'all',
            },
            {
                type: 'all',
                //@ts-ignore
                comics,
            },
            { upsert: true },
        );

        console.log(`saved top all list successfully`);
    } catch (err) {}
}
// /tim-truyen-nang-cao?genres=23&notgenres=&gender=-1&status=-1&minchapter=1&sort=11
export async function updateTopMonthView() {
    try {
        const { mangaData } = await Nt.advancedSearch(23, 1, 11, 1, -1, -1);

        //@ts-ignore
        const comics = [];

        await Promise.allSettled(
            mangaData.map(async (cmc) => {
                const comicDb = await Comic.findOne({ name: cmc.name });

                if (comicDb) comics.push(comicDb);
                else {
                    const newCmc = await insertNewComic(cmc.name);
                    comics.push(newCmc);
                }
            }),
        );

        if (comics.length === 0) return;

        await RTComic.updateOne(
            {
                type: 'month',
            },
            //@ts-ignore
            { type: 'month', comics },
            { upsert: true },
        );

        console.log(`saved top month list successfully`);
    } catch (err) {}
}

// /tim-truyen-nang-cao?genres=23&notgenres=&gender=-1&status=-1&minchapter=1&sort=12
export async function updateTopWeekView() {
    try {
        const { mangaData } = await Nt.advancedSearch(23, 1, 12, 1, -1, -1);

        //@ts-ignore
        const comics = [];

        await Promise.allSettled(
            mangaData.map(async (cmc) => {
                const comicDb = await Comic.findOne({ name: cmc.name });

                if (comicDb) comics.push(comicDb);
                else {
                    const newCmc = await insertNewComic(cmc.name);
                    comics.push(newCmc);
                }
            }),
        );

        if (comics.length === 0) return;

        await RTComic.updateOne(
            {
                type: 'week',
            },
            //@ts-ignore
            { type: 'week', comics },
            { upsert: true },
        );

        console.log(`saved top week list successfully`);
    } catch (err) {}
}

// /tim-truyen-nang-cao?genres=23&notgenres=&gender=-1&status=-1&minchapter=1&sort=12
export async function updateTopDayView() {
    try {
        const { mangaData } = await Nt.advancedSearch(23, 1, 13, 1, -1, -1);

        //@ts-ignore
        const comics = [];

        await Promise.allSettled(
            mangaData.map(async (cmc) => {
                const comicDb = await Comic.findOne({ name: cmc.name });

                if (comicDb) comics.push(comicDb);
                else {
                    const newCmc = await insertNewComic(cmc.name);
                    comics.push(newCmc);
                }
            }),
        );

        if (comics.length === 0) return;

        await RTComic.updateOne(
            {
                type: 'day',
            },
            //@ts-ignore
            { type: 'day', comics },
            { upsert: true },
        );

        console.log(`saved top day list successfully`);
    } catch (err) {}
}

export async function updateSeasonalComics() {
    try {
        const { data } = await axios.get(
            'https://myanimelist.net/anime/season',
        );

        const document = parse(data);

        const allTitles = document
            .querySelectorAll(
                '#content > div.js-categories-seasonal > div:nth-child(1) .h2_anime_title',
            )
            .map((e) => e.textContent.trim());

        //@ts-ignore
        const comics = [];

        //update comics follow anime season
        await Promise.allSettled(
            allTitles.map(async (title) => {
                const comic = await Comic.findOne({ name: title });

                if (comic) {
                    comics.push(comic);
                } else {
                    const { data } = await axios.get(
                        `${NtURL}/tim-truyen?keyword=${title}`,
                    );

                    const document = parse(data);

                    const comicName = document
                        .querySelector(
                            '#ctl00_divCenter > div.Module.Module-170 > div > div > div > div > figure > figcaption > h3 > a',
                        )
                        ?.textContent.trim();

                    const comic = await Comic.findOne({
                        name: comicName,
                    });

                    if (comic) {
                        comics.push(comic);
                    } else {
                        //if comics miss (wrong keyword or vietnamese title)
                        logEvents('season_comics', `update ${title} failed`);
                    }
                }
            }),
        );

        if (comics.length) {
            await RTComic.updateOne(
                { type: 'season' },
                //@ts-ignore
                { type: 'season', comics },
                { upsert: true },
            );
        }
        // @ts-ignore
        return comics;
    } catch (error) {
        return [];
    }
}

export async function updateNewReleaseComics() {
    try {
        const result = await Nt.advancedSearch(-1, 1, 15, 1, -1, -1);

        const comics = await getComics(result.mangaData as IComic[]);

        if (comics && comics.length > 0) {
            await Promise.allSettled(
                comics?.map(async (comic) => {
                    if (comic.status === 'fulfilled') {
                        const existComic = await Comic.findOne({
                            slug: comic.value.slug,
                        });

                        if (!existComic) {
                            await Comic.updateOne(
                                { slug: comic.value.slug },
                                {
                                    status: comic.value.status,
                                    author: comic.value.author,
                                    otherName: comic.value.otherName,
                                    review: comic.value.review,
                                    newChapter: comic.value.newChapter,
                                    thumbnail: comic.value.thumbnail,
                                    name: comic.value.name,
                                    updatedAt: comic.value.updatedAt,
                                    slug: comic.value.slug,
                                },
                                { upsert: true },
                            );
                        }

                        const chapters = await getChapter(
                            comic.value.slug,
                            'NTC',
                        );

                        if (chapters && chapters.length > 0) {
                            const chaptersDoc = await Chapter.findOneAndUpdate(
                                { comicSlug: comic.value.slug },
                                {
                                    comicName: comic.value.name,
                                    comicSlug: comic.value.slug,
                                    source: 'NTC',
                                    chapters_list: [
                                        { sourceName: 'NTC', chapters },
                                    ],
                                },
                                { upsert: true },
                            );
                            await Comic.updateOne(
                                { slug: comic.value.slug },
                                { $set: { chapters: chaptersDoc?._id } },
                            );

                            await Promise.allSettled(
                                chapters.map(async (chapter) => {
                                    const pages = await getPages(
                                        chapter.chapterSlug,
                                        'NTC',
                                    );

                                    if (pages && pages?.length > 0) {
                                        await Page.create({
                                            chapterSlug: chapter.chapterSlug,
                                            chapter: chaptersDoc?._id,
                                            pages,
                                            comicSlug: comic.value.slug,
                                            comicName: comic.value.name,
                                            source: 'NTC',
                                        });
                                    }
                                }),
                            );
                        }
                    }
                }),
            );
        }

        if (result.mangaData && result.mangaData.length > 0) {
            await RTComic.updateOne(
                { type: 'top=15' },
                { type: 'top=15', comics: result.mangaData },
                { upsert: true },
            );
        }
    } catch (error) {}
}

export async function updateNewUpdatedComics() {
    try {
        const result = await Nt.advancedSearch(-1, 1, 0, 1, -1, -1);

        const comics = await getComics(result.mangaData as IComic[]);

        if (comics && comics.length > 0) {
            await Promise.allSettled(
                comics?.map(async (comic) => {
                    if (comic.status === 'fulfilled') {
                        const existComic = await Comic.findOne({
                            slug: comic.value.slug,
                        });

                        if (!existComic) {
                            await Comic.updateOne(
                                { slug: comic.value.slug },
                                {
                                    status: comic.value.status,
                                    author: comic.value.author,
                                    otherName: comic.value.otherName,
                                    review: comic.value.review,
                                    newChapter: comic.value.newChapter,
                                    thumbnail: comic.value.thumbnail,
                                    name: comic.value.name,
                                    updatedAt: comic.value.updatedAt,
                                    slug: comic.value.slug,
                                },
                                { upsert: true },
                            );
                        }

                        const chapters = await getChapter(
                            comic.value.slug,
                            'NTC',
                        );

                        if (chapters && chapters.length > 0) {
                            const chaptersDoc = await Chapter.findOneAndUpdate(
                                { comicSlug: comic.value.slug },
                                {
                                    comicName: comic.value.name,
                                    comicSlug: comic.value.slug,
                                    source: 'NTC',
                                    chapters_list: [
                                        { sourceName: 'NTC', chapters },
                                    ],
                                },
                                { upsert: true },
                            );
                            await Comic.updateOne(
                                { slug: comic.value.slug },
                                { $set: { chapters: chaptersDoc?._id } },
                            );

                            await Promise.allSettled(
                                chapters.map(async (chapter) => {
                                    const pages = await getPages(
                                        chapter.chapterSlug,
                                        'NTC',
                                    );

                                    if (pages && pages?.length > 0) {
                                        await Page.create({
                                            chapterSlug: chapter.chapterSlug,
                                            chapter: chaptersDoc?._id,
                                            pages,
                                            comicSlug: comic.value.slug,
                                            comicName: comic.value.name,
                                            source: 'NTC',
                                        });
                                    }
                                }),
                            );
                        }
                    }
                }),
            );
        }

        if (result.mangaData && result.mangaData.length > 0) {
            await RTComic.updateOne(
                { type: 'top=0' },
                { type: 'top=0', comics: result.mangaData },
                { upsert: true },
            );
        }
    } catch (error) {}
}

const updateComics = [
    updateTopAllView,
    updateTopMonthView,
    updateTopWeekView,
    updateTopDayView,
];

export default updateComics;
