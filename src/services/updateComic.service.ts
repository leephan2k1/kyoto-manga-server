import { Nt } from '../models/Ntc.model';
import Comic from '../models/Comic.model';
import RTComic from '../models/RealTimeComic.model';
import ComicsCenter from '../models';

import { uploadImage } from './cloudinary.service';

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

export async function updateThumbnail() {
    try {
        const result = await Comic.find({
            thumbnail: {
                $not: {
                    $regex: 'res.cloudinary.com',
                    $options: 'i',
                },
            },
        });

        const topAll = await RTComic.findOne({ type: 'all' });
        const topMonth = await RTComic.findOne({ type: 'month' });
        const topWeek = await RTComic.findOne({ type: 'week' });
        const topDay = await RTComic.findOne({ type: 'day' });

        const comicsTopAll = topAll?.comics;
        const comicsTopMonth = topMonth?.comics;
        const comicsTopWeek = topWeek?.comics;
        const comicsTopDay = topDay?.comics;

        await Promise.allSettled(
            result.map(async (comic) => {
                const cloudinaryThumbnail = await uploadImage(
                    String(comic?.thumbnail),
                    String(comic?.name),
                );

                await Comic.updateOne(
                    { name: comic.name },
                    { $set: { thumbnail: cloudinaryThumbnail } },
                    { upsert: true },
                );
            }),
        );

        if (comicsTopAll?.length)
            await Promise.allSettled(
                comicsTopAll?.map(async (comic) => {
                    const cloudinaryThumbnail = await uploadImage(
                        String(comic?.thumbnail),
                        String(comic?.name),
                    );

                    comic.thumbnail = cloudinaryThumbnail;
                }),
            );

        if (comicsTopMonth?.length)
            await Promise.allSettled(
                comicsTopMonth?.map(async (comic) => {
                    const cloudinaryThumbnail = await uploadImage(
                        String(comic?.thumbnail),
                        String(comic?.name),
                    );

                    comic.thumbnail = cloudinaryThumbnail;
                }),
            );

        if (comicsTopWeek?.length)
            await Promise.allSettled(
                comicsTopWeek?.map(async (comic) => {
                    const cloudinaryThumbnail = await uploadImage(
                        String(comic?.thumbnail),
                        String(comic?.name),
                    );

                    comic.thumbnail = cloudinaryThumbnail;
                }),
            );

        if (comicsTopDay?.length)
            await Promise.allSettled(
                comicsTopDay?.map(async (comic) => {
                    const cloudinaryThumbnail = await uploadImage(
                        String(comic?.thumbnail),
                        String(comic?.name),
                    );

                    comic.thumbnail = cloudinaryThumbnail;
                }),
            );

        await RTComic.updateOne(
            { type: 'all' },
            { $set: { comics: comicsTopAll } },
            { upsert: true },
        );
        await RTComic.updateOne(
            { type: 'month' },
            { $set: { comics: comicsTopMonth } },
            { upsert: true },
        );
        await RTComic.updateOne(
            { type: 'week' },
            { $set: { comics: comicsTopWeek } },
            { upsert: true },
        );
        await RTComic.updateOne(
            { type: 'day' },
            { $set: { comics: comicsTopDay } },
            { upsert: true },
        );
    } catch (err) {}
}

const updateComics = [
    updateTopAllView,
    updateTopMonthView,
    updateTopWeekView,
    updateTopDayView,
];

export default updateComics;
