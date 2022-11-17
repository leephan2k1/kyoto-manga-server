// @ts-nocheck
import axios, { AxiosRequestConfig } from 'axios';
import { parse } from 'node-html-parser';
import { Chapter, Genres_NT, Page_Image } from 'types';
import puppeteer from 'puppeteer';
//@ts-ignore
import { LhURL, NtFbURL, OtkUrl } from '../configs';
import { GENRES_NT } from '../constants';
import Scraper from '../libs/Scraper';
import lhModel from '../models/Lh.model';
import OTKModel from '../models/Otk.model';
import { uploadImage } from '../services/cloudinary.service';
import logEvents from '../utils/logEvents';
import { normalizeString } from '../utils/stringHandler';

import Xvfb from 'xvfb';

const xvfb = new Xvfb({
    silent: true,
    xvfb_args: ['-screen', '0', '1280x720x24', '-ac'],
});

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
            await xvfb.start((err) => {
                if (err) console.error('xvfb err::', err);
            });

            const browser = await puppeteer.launch({
                headless: false,
                args: ['--no-sandbox', '--disable-setuid-sandbox'],
            });

            try {
                const pageC = await browser.newPage();

                await pageC.goto(
                    `${this.baseUrl}/tim-truyen-nang-cao?genres=${genres}&gender=${gender}&minchapter=${minchapter}&sort=${top}&page=${page}&status=${status}`,
                    {
                        waitUntil: 'networkidle0',
                    },
                );

                const result = await pageC.$eval('.main', (dom) => {
                    const mangaList = dom.querySelectorAll(
                        '#aspnetForm > main > div:nth-child(2) > div.row .item',
                    );

                    const normalizeString = (str: string) => {
                        const htmlTagsRegex = /(&nbsp;|<([^>]+)>)/g;
                        return str
                            .trim()
                            .replace(/(\r\n|\n|\r|\")/gm, '')
                            .replace(htmlTagsRegex, '');
                    };

                    const GENRES_NT = [
                        { id: '1', value: 'action', label: 'Action' },
                        { id: '2', value: 'truong-thanh', label: 'Adult' },
                        { id: '3', value: 'adventure', label: 'Adventure' },
                        { id: '4', value: 'anime', label: 'Anime' },
                        {
                            id: '5',
                            value: 'chuyen-sinh-213',
                            label: 'Chuyển sinh',
                        },
                        { id: '6', value: 'comedy-99', label: 'Comedy' },
                        { id: '7', value: 'comic', label: 'Comic' },
                        { id: '8', value: 'cooking', label: 'Cooking' },
                        { id: '9', value: 'co-dai-207', label: 'Cổ đại' },
                        {
                            id: '10',
                            value: 'doujinshi',
                            label: 'Doujinshi',
                        },
                        { id: '11', value: 'drama-103', label: 'Drama' },
                        { id: '12', value: 'dam-my', label: 'Đam mỹ' },
                        { id: '13', value: 'ecchi', label: 'Ecchi' },
                        {
                            id: '14',
                            value: 'fantasy-105',
                            label: 'Fantasy',
                        },
                        { id: '16', value: 'harem-107', label: 'Harem' },
                        {
                            id: '17',
                            value: 'historical',
                            label: 'Historical',
                        },
                        { id: '18', value: 'horror', label: 'Horror' },
                        { id: '20', value: 'josei', label: 'Josei' },
                        {
                            id: '21',
                            value: 'live-action',
                            label: 'Live action',
                        },
                        { id: '23', value: 'manga-112', label: 'Manga' },
                        { id: '24', value: 'manhua', label: 'Manhua' },
                        {
                            id: '25',
                            value: 'manhwa-11400',
                            label: 'Manhwa',
                        },
                        {
                            id: '10',
                            value: 'doujinshi',
                            label: 'Doujinshi',
                        },
                        {
                            id: '26',
                            value: 'martial-arts',
                            label: 'Martial Arts',
                        },
                        { id: '27', value: 'mature', label: 'Mature' },
                        { id: '28', value: 'mecha-117', label: 'Mecha' },
                        { id: '30', value: 'mystery', label: 'Mystery' },
                        {
                            id: '32',
                            value: 'ngon-tinh',
                            label: 'Ngôn tình',
                        },
                        { id: '33', value: 'one-shot', label: 'One shot' },
                        {
                            id: '34',
                            value: 'psychological',
                            label: 'Psychological',
                        },
                        {
                            id: '35',
                            value: 'romance-121',
                            label: 'Romance',
                        },
                        {
                            id: '36',
                            value: 'school-life',
                            label: 'School Life',
                        },
                        { id: '37', value: 'sci-fi', label: 'Sci-fi' },
                        { id: '38', value: 'seinen', label: 'Seinen' },
                        { id: '39', value: 'shoujo', label: 'Shoujo' },
                        {
                            id: '40',
                            value: 'shoujo-ai-126',
                            label: 'Shoujo Ai',
                        },
                        {
                            id: '41',
                            value: 'shounen-127',
                            label: 'Shounen',
                        },
                        {
                            id: '42',
                            value: 'shounen-ai',
                            label: 'Shounen Ai',
                        },
                        {
                            id: '43',
                            value: 'slice-of-life',
                            label: 'Slice Of Life',
                        },
                        { id: '58', value: 'yaoi', label: 'Yaoi' },
                        {
                            id: '45',
                            value: 'soft-yaoi',
                            label: 'Soft Yaoi',
                        },
                        { id: '59', value: 'yuri', label: 'Yuri' },
                        {
                            id: '46',
                            value: 'soft-yuri',
                            label: 'Soft Yuri',
                        },
                        { id: '47', value: 'sports', label: 'Sports' },
                        {
                            id: '48',
                            value: 'supernatural',
                            label: 'Supernatural',
                        },
                        { id: '44', value: 'smut', label: 'Smut' },
                        {
                            id: '49',
                            value: 'tap-chi-truyen-tranh',
                            label: 'Tạp chí truyện tranh',
                        },
                        {
                            id: '50',
                            value: 'thieu-nhi',
                            label: 'Thiếu nhi',
                        },
                        {
                            id: '51',
                            value: 'tragedy-136',
                            label: 'Tragedy',
                        },
                        {
                            id: '52',
                            value: 'trinh-tham',
                            label: 'Trinh thám',
                        },
                        {
                            id: '54',
                            value: 'truyen-scan',
                            label: 'Truyện Scan',
                        },
                        {
                            id: '53',
                            value: 'truyen-mau',
                            label: 'Truyện màu',
                        },
                        { id: '55', value: 'viet-nam', label: 'Việt Nam' },
                        { id: '56', value: 'webtoon', label: 'Webtoon' },
                        {
                            id: '57',
                            value: 'xuyen-khong-205',
                            label: 'Xuyên không',
                        },
                        { id: '60', value: '16', label: '16+' },
                    ];

                    const totalPagesPath = String(
                        document.querySelector('.pagination > li')?.innerHTML,
                    ).trim();

                    const totalPages =
                        Number(
                            totalPagesPath
                                .substring(totalPagesPath.lastIndexOf('/') + 1)
                                .trim(),
                        ) || 1;

                    return {
                        totalPages,
                        mangaData: [...mangaList].map((manga) => {
                            const source = String(
                                manga
                                    .querySelector('img')
                                    ?.getAttribute('data-original'),
                            );

                            const thumbnail = ['http', 'https'].some(
                                (protocol) => String(source).includes(protocol),
                            )
                                ? String(source)
                                : `https:${String(source)}`;

                            const newChapter =
                                manga.querySelector('ul > li > a')?.innerHTML;
                            const updatedAt =
                                manga.querySelector('ul > li > i')?.innerHTML;
                            const view =
                                manga.querySelector('pull-left > i')?.innerHTML;
                            const name = normalizeString(
                                String(manga.querySelector('h3 a')?.innerHTML),
                            );

                            const tooltip = manga.querySelectorAll(
                                '.box_li .message_main p',
                            );
                            let status: string | null = '';
                            let author: string | null = '';
                            let genres: string[] | Genres_NT[] = [];
                            let otherName: string | null = '';

                            tooltip.forEach((item) => {
                                const title =
                                    item.querySelector('label')?.textContent;
                                const str = normalizeString(
                                    String(item.textContent).substring(
                                        String(item.textContent).lastIndexOf(
                                            ':',
                                        ) + 1,
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
                                        genre
                                            .toString()
                                            .toLocaleLowerCase()
                                            .trim(),
                                );
                                return genreObj;
                            });

                            const review = normalizeString(
                                String(
                                    manga.querySelector('.box_li .box_text')
                                        ?.textContent,
                                ),
                            );

                            const path = String(
                                manga
                                    .querySelector('h3 a')
                                    ?.getAttribute('href'),
                            );
                            const slug = path.substring(
                                path.lastIndexOf('/') + 1,
                            );

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
                        }),
                    };
                });

                await xvfb.stop();
                await browser.close();
                return result;
            } catch (error) {
                await xvfb.stop();
                await browser.close();
                console.log('final error advancedSearch:: ', error);
                return { mangaData: [], totalPages: 0 };
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
                await xvfb.start((err) => {
                    if (err) console.error('xvfb err::', err);
                });

                const browser = await puppeteer.launch({
                    headless: false,
                    args: ['--no-sandbox', '--disable-setuid-sandbox'],
                });
                try {
                    const page = await browser.newPage();
                    await page.goto(`${this.baseUrl}${chapterSlug}`, {
                        waitUntil: 'networkidle0',
                    });
                    const pages = await page.$$eval(
                        '.reading-detail .page-chapter',
                        (pagesRaw) => {
                            return [...pagesRaw].map((page) => {
                                const id = String(
                                    page
                                        .querySelector('img')
                                        ?.getAttribute('data-index'),
                                );

                                const source = page
                                    .querySelector('img')
                                    ?.getAttribute('data-original');

                                const srcCDN = page
                                    .querySelector('img')
                                    ?.getAttribute('data-cdn');

                                const alternativeSrc = page
                                    .querySelector('img')
                                    ?.getAttribute('src');

                                const imgSrc = ['http', 'https'].some(
                                    (protocol) =>
                                        String(source).includes(protocol),
                                )
                                    ? String(source)
                                    : `https:${String(source)}`;

                                const imgSrcCDN = ['http', 'https'].some(
                                    (protocol) =>
                                        String(
                                            srcCDN ? srcCDN : alternativeSrc,
                                        ).includes(protocol),
                                )
                                    ? String(srcCDN ? srcCDN : alternativeSrc)
                                    : `https:${String(
                                          srcCDN ? srcCDN : alternativeSrc,
                                      )}`;

                                return {
                                    id,
                                    src: imgSrc,
                                    fallbackSrc: imgSrcCDN,
                                };
                            });
                        },
                    );

                    await xvfb.stop();
                    await browser.close();

                    return pages;
                } catch (error) {
                    console.log('error::: ', error);
                    await xvfb.stop();
                    await browser.close();
                    return [] as Page_Image[];
                }
            }
        }
    }

    public async getComicBySlug(comicSlug: string) {
        try {
            const { data } = await this.client.get(
                `${this.baseUrl}/truyen-tranh/${comicSlug}`,
            );
            const document = parse(data);

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
                    case 'tên khác':
                        otherName = normalizeString(
                            String(e.querySelector('h2')?.textContent),
                        );

                        break;
                    case 'tác giả':
                        author = normalizeString(
                            String(e.querySelector('.col-xs-8')?.textContent),
                        );

                        break;
                    case 'tình trạng':
                        status = normalizeString(
                            String(e.querySelector('.col-xs-8')?.textContent),
                        );
                        break;
                    case 'thể loại':
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

            thumbnail = await uploadImage(
                String(thumbnail),
                `slug ${comicSlug}`,
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
        } catch (err) {
            logEvents('comics', `get ${comicSlug} failed`);
            return null;
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
                const { data } = await axios.get(`${NtFbURL}${chapterSlug}`);

                const document = parse(data);

                const aTag = document.querySelector(
                    '#ctl00_divCenter > div > div:nth-child(1) > div.top > h1 > a',
                );

                if (!aTag) throw new Error();

                const title = normalizeString(String(aTag?.textContent));

                return title;
            } catch (error) {
                await xvfb.start((err) => {
                    if (err) console.error('xvfb err::', err);
                });

                const browser = await puppeteer.launch({
                    headless: false,
                    args: ['--no-sandbox', '--disable-setuid-sandbox'],
                });
                try {
                    const page = await browser.newPage();

                    await page.goto(`${this.baseUrl}${chapterSlug}`);

                    const title = await page.$eval(
                        '#ctl00_divCenter > div > div:nth-child(1) > div.top > h1 > a',
                        (dom) => {
                            return String(dom.textContent);
                        },
                    );

                    await xvfb.stop();
                    await browser.close();

                    return title;
                } catch (error) {
                    console.log('FINAL ERROR: ', error);
                    await xvfb.stop();
                    await browser.close();
                    return null;
                }
            }
        }
    }
}

export const Nt = NtModel.Instance(process.env.NT_SOURCE_URL as string);
