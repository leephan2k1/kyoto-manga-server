import { AxiosRequestConfig } from 'axios';
import { parse } from 'node-html-parser';
import { Chapter, Genres_NT } from 'types';

import { GENRES_NT } from '../constants';
import Scraper from '../libs/Scraper';
import logEvents from '../utils/logEvents';
import { normalizeString } from '../utils/stringHandler';

export default class NtModel extends Scraper {
    private static instance: NtModel;

    private constructor(
        baseUrl: string,
        axiosConfig?: AxiosRequestConfig,
        timeout?: number,
    ) {
        super(baseUrl, axiosConfig, timeout);
    }

    public static Instance(
        baseUrl: string,
        axiosConfig?: AxiosRequestConfig,
        timeout?: number,
    ) {
        if (!this.instance) {
            this.instance = new this(baseUrl, axiosConfig, timeout);
        }

        return this.instance;
    }

    private async parseSource(document: HTMLElement) {
        const mangaList = document.querySelectorAll(
            '#aspnetForm > main > div:nth-child(2) > div.row .item',
        );

        const mangaData = [...mangaList].map((manga) => {
            const thumbnail = this.unshiftProtocol(
                String(
                    manga.querySelector('img')?.getAttribute('data-original'),
                ) || String(manga.querySelector('img')?.getAttribute('src')),
            );

            const newChapter = manga.querySelector('ul > li > a')?.innerHTML;
            const updatedAt = manga.querySelector('ul > li > i')?.innerHTML;
            const view = manga.querySelector('pull-left > i')?.innerHTML;
            const name = normalizeString(
                String(manga.querySelector('h3 a')?.innerHTML),
            );

            const tooltip = manga.querySelectorAll('.box_li .message_main p');
            let status: string | null = '';
            let author: string | null = '';
            let genres: string[] | Genres_NT[] = [];
            let otherName: string | null = '';

            tooltip.forEach((item) => {
                const title = item.querySelector('label')?.textContent;
                const str = normalizeString(
                    String(item.textContent).substring(
                        String(item.textContent).lastIndexOf(':') + 1,
                    ),
                );

                switch (title) {
                    case 'Thể loại:':
                        genres = str.split(', ');
                        break;
                    case 'Tác giả:':
                        author = str;
                        break;
                    case 'Tình trạng:':
                        status = str;
                        break;
                    case 'Tên khác:':
                        otherName = str;
                        break;
                }
            });

            //@ts-ignore
            genres = genres?.map((genre) => {
                const genreObj = GENRES_NT.find(
                    (e) =>
                        e.label.toLowerCase().trim() ===
                        genre.toString().toLocaleLowerCase().trim(),
                );
                return genreObj;
            });

            const review = normalizeString(
                String(manga.querySelector('.box_li .box_text')?.textContent),
            );

            const path = String(
                manga.querySelector('h3 a')?.getAttribute('href'),
            );
            const slug = path.substring(path.lastIndexOf('/') + 1);

            return {
                status,
                author,
                genres,
                otherName,
                review,
                newChapter,
                thumbnail,
                view,
                name,
                updatedAt,
                slug,
            };
        });

        const totalPagesPath = String(
            document.querySelector('.pagination > li')?.innerHTML,
        ).trim();
        const totalPages =
            Number(
                totalPagesPath
                    .substring(totalPagesPath.lastIndexOf('/') + 1)
                    .trim(),
            ) || 1;

        return { mangaData, totalPages };
    }

    public async searchQuery(query: string) {
        try {
            const { data } = await this.client.get(
                `${this.baseUrl}/tim-truyen`,
                {
                    params: {
                        keyword: query,
                    },
                },
            );

            const document = parse(data);

            //@ts-ignore
            return document && this.parseSource(document);
        } catch (err) {
            console.log(err);
            return { mangaData: [], totalPages: 0 };
        }
    }

    public async getChapters(comicSlug: string): Promise<Chapter[]> {
        try {
            const { data } = await this.client.get(
                `${this.baseUrl}/truyen-tranh/${comicSlug}`,
            );

            const document = parse(data);

            const chapterListRaw = document.querySelectorAll(
                `#item-detail #nt_listchapter ul .row`,
            );
            const chapterList = [...chapterListRaw].map((chapter) => {
                const chapterTitle = normalizeString(
                    String(chapter.querySelector('a')?.textContent),
                );
                const chapterId = chapter
                    .querySelector('a')
                    ?.getAttribute('data-id');

                const arr = String(
                    chapter.querySelector('a')?.getAttribute('href'),
                ).split('/');

                const slug = String(
                    chapter.querySelector('a')?.getAttribute('href'),
                );
                const chapterSlug = slug.slice(slug.indexOf('/truyen-tranh'));

                const chapterStr = arr[arr.length - 2];

                const chapterNumber = chapterStr.slice(
                    chapterStr.indexOf('-') + 1,
                );

                const updatedAt = normalizeString(
                    String(chapter.querySelectorAll('div')[1].textContent),
                );

                const view = normalizeString(
                    String(chapter.querySelectorAll('div')[2].textContent),
                );

                return {
                    chapterId: String(chapterId),
                    chapterSlug,
                    chapterNumber,
                    chapterTitle,
                    updatedAt,
                    view,
                };
            });

            return chapterList;
        } catch (err) {
            console.log(`Scrape chapter ${comicSlug} error`);
            logEvents('chapters', `get ${comicSlug} source NTC error!`);
            return [] as Chapter[];
        }
    }

    public async advancedSearch(
        genres: number,
        minchapter: number,
        top: number,
        page: number,
        status: number,
        gender: number,
    ) {
        try {
            const { data } = await this.client.get(
                `${this.baseUrl}/tim-truyen-nang-cao`,
                {
                    params: {
                        genres,
                        gender,
                        minchapter,
                        sort: top,
                        page,
                        status,
                    },
                },
            );

            const document = parse(data);

            //@ts-ignore
            const { mangaData, totalPages } = await this.parseSource(document);

            return { mangaData, totalPages };
        } catch (err) {
            console.log(err);
            return { mangaData: [], totalPages: 0 };
        }
    }
}

export const Nt = NtModel.Instance(process.env.NT_SOURCE_URL as string);
