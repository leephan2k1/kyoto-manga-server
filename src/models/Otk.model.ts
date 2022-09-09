import Scraper from '../libs/Scraper';
import { parse } from 'node-html-parser';
import axios, { AxiosRequestConfig } from 'axios';
import { normalizeString } from '../utils/stringHandler';
import { Chapter, Page_Image } from 'types';

export default class OTKModel extends Scraper {
    private static instance: OTKModel;

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

    public async search(q: string) {
        try {
            const { data } = await this.client.get(
                `${this.baseUrl}/Home/Search`,
                {
                    params: {
                        search: q.trim().toLowerCase(),
                    },
                },
            );

            const document = parse(data);

            const containers = document.querySelectorAll(
                '.collection-body .col-lg-1-5.col-md-2.col-sm-3.col-xs-4.col-xs-4-5',
            );

            const exactMatchs = containers.map((e) => {
                const title = e.querySelector(
                    '.text-overflow.capitalize',
                )?.textContent;

                if (
                    title?.trim().toLocaleLowerCase() ===
                    q.trim().toLocaleLowerCase()
                ) {
                    return {
                        title: normalizeString(title),
                        slug: e.querySelector('a')?.getAttribute('href'),
                    };
                }
            });

            return exactMatchs;
        } catch (err) {
            console.log(err);
            return null;
        }
    }

    public async getChapters(comicUrl: string): Promise<Chapter[]> {
        try {
            const { data } = await axios.get(comicUrl);

            const document = parse(data);

            const chapterContainer = document.querySelectorAll(
                '#chapter > div.chapter-list > table > tbody > tr.chapter',
            );

            const chapters = chapterContainer.map((e) => {
                const chapterNumber = String(
                    e.querySelector('td:nth-child(1)')?.textContent.trim(),
                );

                const chapterTitle = String(
                    e.querySelector('td:nth-child(2) > a')?.textContent.trim(),
                );

                const view = String(
                    e.querySelector('td:nth-child(3)')?.textContent.trim(),
                );

                const updatedAt = String(
                    e
                        .querySelector('td.read-chapter.minimize')
                        ?.textContent.trim(),
                );

                const chapterSlug = String(
                    e
                        .querySelector('td:nth-child(2) > a')
                        ?.getAttribute('href'),
                );

                const chapterId = String(chapterSlug?.split('/')[2]);

                return {
                    chapterId,
                    chapterSlug,
                    chapterNumber,
                    chapterTitle,
                    view,
                    updatedAt,
                };
            });

            return chapters;
        } catch (error) {
            return [] as Chapter[];
        }
    }

    public async getChapterPages(chapterSlug: string): Promise<Page_Image[]> {
        try {
            const { data } = await this.client.get(
                `${this.baseUrl}${chapterSlug}`,
            );
            const document = parse(data);

            const imageContainer = document.querySelectorAll('.image-wraper');

            const images = Array.from(imageContainer).map((imgDom) => {
                const id = String(
                    imgDom.querySelector('img')?.getAttribute('page'),
                );

                const imgElem = imgDom
                    .querySelector('img')
                    ?.getAttribute('src');

                if (!imgElem) {
                    throw new Error();
                }

                return { id, src: String(imgElem) };
            });

            return images;
        } catch (err) {
            return [] as Page_Image[];
        }
    }

    public async getMetaInfoFromPages(chapterSlug: string) {
        try {
            const { data } = await this.client.get(
                `${this.baseUrl}${chapterSlug}`,
            );

            const doc = parse(data);

            const aTag = doc.querySelector(
                '#chap_view > ul > li:nth-child(3) > a > span',
            );

            const title = normalizeString(String(aTag?.textContent));

            return title;
        } catch (error) {
            console.log('ERROR: ', error);
            return null;
        }
    }
}
