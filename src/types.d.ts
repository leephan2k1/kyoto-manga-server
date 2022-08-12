export interface Comic {
    _id?: string;
    name: string;
    __v?: number;
    author: string;
    custom_id: number;
    genres: Genre[];
    newChapter: string;
    otherName: string;
    review: string;
    slug: string;
    sourcesAvailable?: Source[];
    status: string;
    thumbnail: string;
    updatedAt: string;
}

export type Source_Type = 'OTK' | 'LHM' | 'T24' | 'NTC';

export interface Genre {
    id: string;
    value: string;
    label: string;
    _id?: string;
}

export interface Comic_Chapters {
    comicSlug: string;
    comicName: string;
    source: string;
    chapters_list: {
        sourceName: string;
        chapters: Chapter[];
    }[];
}

export interface Chapter {
    chapterId: string;
    chapterSlug: string;
    chapterNumber: string;
    chapterTitle: string;
    updatedAt: string;
    view: string;
}

export interface Page_Image {
    id: string;
    src: string;
    fallbackSrc?: string;
}

export interface LHSearch {
    id: number;
    name: string;
    cover_url: string;
    pilot: string;
    url: string;
}

export interface Genres_NT {
    id: string;
    value: string;
    label: string;
}

export interface NtDataList {
    mangaData: MangaPreview[];
    totalPages: number;
}

export interface Source {
    sourceName: string;
    sourceSlug: string;
}
