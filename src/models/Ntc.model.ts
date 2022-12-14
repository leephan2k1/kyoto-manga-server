// @ts-nocheck
import axios, { AxiosRequestConfig } from 'axios';
import { parse } from 'node-html-parser';
import { Chapter, Genres_NT, Page_Image } from 'types';
//@ts-ignore
import { LhURL, NtFbURL, OtkUrl, Proxy_URL } from '../configs';
import { GENRES_NT } from '../constants';
import Scraper from '../libs/Scraper';
import lhModel from '../models/Lh.model';
import OTKModel from '../models/Otk.model';
import logEvents from '../utils/logEvents';
import { normalizeString } from '../utils/stringHandler';

const Lh = lhModel.Instance(LhURL, 30000);
const Otk = OTKModel.Instance(OtkUrl);

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
            `#ctl00_divCenter .items .row .item`,
        );

        const mangaData = [...mangaList].map((manga) => {
            const thumbnail = this.unshiftProtocol(
                String(
                    manga.querySelector('img')?.getAttribute('data-original'),
                ) || String(manga.querySelector('img')?.getAttribute('src')),
            );

            const newChapter = normalizeString(
                manga.querySelector('ul > li > a')?.innerHTML,
            );
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
                    case 'Th??? lo???i:':
                        genres = str.split(' - ');
                        break;
                    case 'T??c gi???:':
                        author = str;
                        break;
                    case 'T??nh tr???ng:':
                        status = str;
                        break;
                    case 'T??n kh??c:':
                        otherName = str;
                        break;
                }
            });

            //@ts-ignore
            genres = genres.reduce((res, genre) => {
                const genreObj = GENRES_NT.find(
                    (e) =>
                        e.label.toLowerCase().trim() ===
                        genre.toString().toLocaleLowerCase().trim(),
                );
                if (genreObj) res.push(genreObj);

                return res;
            }, []);

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
            try {
                const { data } = await axios.get(
                    `${Proxy_URL}/?url=${
                        this.baseUrl
                    }/tim-truyen?keyword=${encodeURIComponent(query)}`,
                );

                const document = parse(data);

                //@ts-ignore
                return document && this.parseSource(document);
            } catch (error) {
                console.log(err);
                return { mangaData: [], totalPages: 0 };
            }
        }
    }

    private async parseChapter(document: HTMLElement) {
        try {
            const chapterListRaw = document.querySelectorAll(
                `#item-detail #nt_listchapter ul .row`,
            );
            return [...chapterListRaw].map((chapter) => {
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
        } catch (error) {
            return [] as Chapter[];
        }
    }

    public async getChapters(comicSlug: string): Promise<Chapter[]> {
        try {
            const { data } = await this.client.get(
                `${this.baseUrl}/truyen-tranh/${comicSlug}`,
            );

            const document = parse(data);

            const chapterList = await this.parseChapter(document);

            return chapterList;
        } catch (err) {
            try {
                const { data } = await this.client.get(
                    `${Proxy_URL}/?url=${this.baseUrl}/truyen-tranh/${comicSlug}`,
                );

                const document = parse(data);

                const chapterList = await this.parseChapter(document);

                return chapterList;
            } catch (error) {
                console.log(`Scrape chapter ${comicSlug} error: `, error);
                logEvents('chapters', `get ${comicSlug} source NTC error!`);
                return [] as Chapter[];
            }
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
            const res = await this.client.get(
                `${this.baseUrl}/tim-truyen-nang-cao`,

                {
                    headers: {
                        accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
                    },
                    params: {
                        genres,
                        gender,
                        status,
                        minchapter,
                        sort: top,
                        page,
                    },
                },
            );

            const document = parse(res.data);

            //@ts-ignore
            const { mangaData, totalPages } = await this.parseSource(document);

            if (mangaData.length === 0) throw new Error();

            return { mangaData, totalPages };
        } catch (err) {
            try {
                console.log('get by proxy');
                const res = await axios.get(
                    `${Proxy_URL}/?url=${this.baseUrl}/tim-truyen-nang-cao?genres=${genres}&gender=${gender}&status=${status}&minchapter=${minchapter}&sort=${top}&page=${page}`,
                );

                const document = parse(res.data);

                //@ts-ignore
                const { mangaData, totalPages } = await this.parseSource(
                    document,
                );

                if (mangaData.length === 0) throw new Error();

                return { mangaData, totalPages };
            } catch (error) {
                try {
                    const { data } = await axios.get(
                        `${NtFbURL}/tim-truyen-live`,
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
                    const { mangaData, totalPages } = await this.parseSource(
                        document,
                    );

                    return { mangaData, totalPages };
                } catch (error) {
                    console.log('final error:: ', error);
                    return { mangaData: [], totalPages: 0 };
                }
            }
        }
    }

    private async parseChapterPages(document: HTMLElement) {
        const pagesRaw = document.querySelectorAll(
            '.reading-detail .page-chapter',
        );

        const pages = [...pagesRaw].map((page) => {
            const id = String(
                page.querySelector('img')?.getAttribute('data-index'),
            );

            const source = page
                .querySelector('img')
                ?.getAttribute('data-original');

            const srcCDN = page.querySelector('img')?.getAttribute('data-cdn');

            const alternativeSrc = page
                .querySelector('img')
                ?.getAttribute('src');

            const imgSrc = super.unshiftProtocol(String(source));

            const imgSrcCDN = super.unshiftProtocol(
                String(srcCDN ? srcCDN : alternativeSrc),
            );

            return { id, src: imgSrc, fallbackSrc: imgSrcCDN };
        });

        return pages;
    }

    public async getChapterPages(chapterSlug: string): Promise<Page_Image[]> {
        try {
            const { data } = await this.client.get(
                `${this.baseUrl}${chapterSlug}`,
            );
            const document = parse(data);

            // @ts-ignore
            const pages = await this.parseChapterPages(document);

            if (!pages.length) throw new Error();

            return pages;
        } catch (err) {
            try {
                const { data } = await axios.get(`${NtFbURL}${chapterSlug}`);

                const document = parse(data);
                // @ts-ignore
                const pages = await this.parseChapterPages(document);

                if (!pages.length) throw new Error();

                return pages;
            } catch (error) {
                try {
                    const { data } = await axios.get(
                        `${Proxy_URL}/?url=${this.baseUrl}${chapterSlug}`,
                    );

                    const document = parse(data);
                    // @ts-ignore
                    const pages = await this.parseChapterPages(document);

                    if (!pages.length) throw new Error();

                    return pages;
                } catch (error) {
                    console.log('error::: ', error);

                    return [] as Page_Image[];
                }
            }
        }
    }

    private async parseComicBySlug(document: HTMLElement, comicSlug: string) {
        try {
            const name = normalizeString(
                String(
                    document.querySelector('#item-detail > h1')?.textContent,
                ),
            );

            const infoContainer = document.querySelectorAll(
                '#item-detail > div.detail-info > div > div.col-xs-8.col-info > ul > li',
            );

            let status: string | null = '';
            let author: string | null = '';
            let genres: string[] | Genres_NT[] = [];
            let otherName: string | null = '';

            infoContainer.forEach((e) => {
                const title = normalizeString(
                    String(
                        e
                            .querySelector('p.name.col-xs-4')
                            ?.textContent.toLowerCase(),
                    ),
                );

                switch (title) {
                    case 't??n kh??c':
                        otherName = normalizeString(
                            String(e.querySelector('h2')?.textContent),
                        );

                        break;
                    case 't??c gi???':
                        author = normalizeString(
                            String(e.querySelector('.col-xs-8')?.textContent),
                        );

                        break;
                    case 't??nh tr???ng':
                        status = normalizeString(
                            String(e.querySelector('.col-xs-8')?.textContent),
                        );
                        break;
                    case 'th??? lo???i':
                        const rawGenre = e
                            .querySelectorAll('.col-xs-8 a')
                            .map((aTag) => normalizeString(String(aTag)));

                        genres = rawGenre.reduce((result, rawElement) => {
                            const check = GENRES_NT.find(
                                (genreNt) =>
                                    genreNt.label.toLowerCase().trim() ===
                                    rawElement.toLowerCase().trim(),
                            );

                            if (check) {
                                result.push(check);
                            }

                            return result;
                        }, [] as Genres_NT[]);
                        break;
                }
            });

            const review = normalizeString(
                String(
                    document.querySelector(
                        '#item-detail > div.detail-content > p',
                    )?.textContent,
                ),
            );

            const newChapter = normalizeString(
                String(
                    document.querySelector(
                        '#nt_listchapter > nav > ul > li:nth-child(1) > div.col-xs-5.chapter > a',
                    )?.textContent,
                ),
            );

            let thumbnail = this.unshiftProtocol(
                String(
                    document
                        .querySelector(
                            '#item-detail > div.detail-info > div > div.col-xs-4.col-image > img',
                        )
                        ?.getAttribute('src'),
                ),
            );

            const updatedAt = normalizeString(
                String(
                    document.querySelector(
                        '#nt_listchapter > nav > ul > li:nth-child(1) > div.col-xs-4.text-center.no-wrap.small',
                    )?.textContent,
                ),
            );

            const sourcesAvailable = [];

            const LHRes = await Lh.search(name);
            if (LHRes) {
                sourcesAvailable.push({
                    sourceName: 'LHM',
                    sourceSlug: LHRes.url,
                });
            }

            const OtkRes = await Otk.search(name);
            if (OtkRes?.length && OtkRes[0]?.slug) {
                sourcesAvailable.push({
                    sourceName: 'OTK',
                    sourceSlug:
                        (process.env.OTK_SOURCE_URL as string) + OtkRes[0].slug,
                });
            }

            return {
                name,
                status,
                author,
                genres,
                otherName,
                sourcesAvailable,
                review,
                newChapter,
                thumbnail,
                updatedAt,
                slug: comicSlug,
            };
        } catch (error) {
            console.log('parse comic by slug error: ', error);
            return null;
        }
    }

    public async getComicBySlug(comicSlug: string) {
        try {
            const { data } = await this.client.get(
                `${this.baseUrl}/truyen-tranh/${comicSlug}`,
            );
            const document = parse(data);

            const res = await this.parseComicBySlug(document, comicSlug);

            if (res) return res;
            else throw new Error();
        } catch (err) {
            try {
                console.log('get by proxy');
                const { data } = await axios.get(
                    `${Proxy_URL}/?url=${this.baseUrl}/truyen-tranh/${comicSlug}`,
                );

                const document = parse(data);

                const res = await this.parseComicBySlug(document, comicSlug);

                if (res) return res;
                else throw new Error();
            } catch (error) {
                logEvents('comics', `get ${comicSlug} failed`);
                return null;
            }
        }
    }

    public async getMetaInfoFromPages(chapterSlug: string) {
        try {
            const { data } = await this.client.get(
                `${this.baseUrl}${chapterSlug}`,
            );

            const document = parse(data);

            const aTag = document.querySelector(
                '#ctl00_divCenter > div > div:nth-child(1) > div.top > h1 > a',
            );

            const title = normalizeString(String(aTag?.textContent));

            return title;
        } catch (error) {
            try {
                const { data } = await axios.get(
                    `${Proxy_URL}/?url=${this.baseUrl}${chapterSlug}`,
                );

                const document = parse(data);

                const aTag = document.querySelector(
                    '#ctl00_divCenter > div > div:nth-child(1) > div.top > h1 > a',
                );

                if (!aTag) throw new Error();

                const title = normalizeString(String(aTag?.textContent));

                return title;
            } catch (error) {
                console.log('FINAL ERROR: ', error);
            }
        }
    }
}

export const Nt = NtModel.Instance(process.env.NT_SOURCE_URL as string);
