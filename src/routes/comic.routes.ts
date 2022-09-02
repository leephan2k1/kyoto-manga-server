import { RouteOptions } from 'fastify';
import comicsController from '../controllers/comics.controller';
import chaptersController from '../controllers/chapters.controller';

const {
    handleSearch,
    handleGetSeason,
    handleFilters,
    handleGetComicInfo,
    handleRandomComics,
    handleAddManuallyComicSeason,
    handleCheckUptime,
    handleUpVote,
    handleDownVote,
    handleGetRecommended,
} = comicsController();
const { handleGetChapter } = chaptersController();

export const comicCheckUptimeRoute: RouteOptions = {
    url: '/comics/ping',
    method: 'GET',
    schema: {
        querystring: {
            source: { type: 'string' },
        },
    },
    handler: handleCheckUptime,
};

export const comicUpVoteRoute: RouteOptions = {
    url: '/comics/upvote',
    method: 'POST',
    schema: {
        body: { $ref: 'voteSchema#' },
    },
    handler: handleUpVote,
};

export const comicUpDownRoute: RouteOptions = {
    url: '/comics/downvote',
    method: 'DELETE',
    schema: {
        body: { $ref: 'voteSchema#' },
    },
    handler: handleDownVote,
};

export const comicRecommendedVoteRoute: RouteOptions = {
    url: '/comics/recommended',
    method: 'GET',
    schema: {
        querystring: {
            limit: { type: 'number', default: 10 },
            sort: { type: 'number', default: -1 },
        },
    },
    handler: handleGetRecommended,
};

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

export const comicSeasonalRoute: RouteOptions = {
    url: '/comics/season',
    method: 'GET',
    handler: handleGetSeason,
};

export const comicsAddSeasonalRoute: RouteOptions = {
    url: '/comics/season',
    method: 'POST',
    schema: {
        querystring: {
            body: {
                type: 'object',
                properties: {
                    titles: { type: 'array' },
                },
            },
        },
    },
    handler: handleAddManuallyComicSeason,
};

export const comicRandomRoute: RouteOptions = {
    url: '/comics/random',
    method: 'GET',
    schema: {
        querystring: {
            limit: { type: 'integer', default: 10 },
        },
    },
    handler: handleRandomComics,
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
    comicCheckUptimeRoute,
    comicChaptersRoute,
    comicSeasonalRoute,
    comicUpVoteRoute,
    comicUpDownRoute,
    comicRecommendedVoteRoute,
    comicsAddSeasonalRoute,
    comicRandomRoute,
    comicInfo,
];
export default comicsRoutes;
