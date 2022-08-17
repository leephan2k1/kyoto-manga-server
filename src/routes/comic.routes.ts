import { RouteOptions } from 'fastify';
import comicsController from '../controllers/comics.controller';
import chaptersController from '../controllers/chapters.controller';

const { handleSearch, handleFilters, handleGetComicInfo } = comicsController();
const { handleGetChapter } = chaptersController();

export const comicSearchRoute: RouteOptions = {
    url: '/comics/search',
    method: 'GET',
    schema: {
        querystring: {
            q: { type: 'string' },
        },
    },
    handler: handleSearch,
};

export const comicFiltersRoute: RouteOptions = {
    url: '/comics/filters',
    method: 'GET',
    schema: {
        querystring: {
            genres: { type: 'integer', default: -1 },
            gender: { type: 'integer', default: -1 },
            status: { type: 'integer', default: -1 },
            top: { type: 'integer', default: 0 },
            minChapter: { type: 'integer', default: 1 },
            page: { type: 'integer', default: 1 },
        },
    },
    handler: handleFilters,
};

export const comicChaptersRoute: RouteOptions = {
    url: '/comics/:comicSlug/chapters',
    method: 'GET',
    schema: {
        querystring: {
            options: { type: 'string' },
        },
    },
    handler: handleGetChapter,
};

export const comicInfo: RouteOptions = {
    url: '/comics/:comicSlug/info',
    method: 'GET',
    handler: handleGetComicInfo,
};

const comicsRoutes = [
    comicSearchRoute,
    comicFiltersRoute,
    comicChaptersRoute,
    comicInfo,
];
export default comicsRoutes;
