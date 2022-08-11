import { RouteOptions } from 'fastify';
import comicsController from '../controllers/comics.controller';

const { handleSearch, handleFilters } = comicsController();

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

const comicsRoutes = [comicSearchRoute, comicFiltersRoute];
export default comicsRoutes;
