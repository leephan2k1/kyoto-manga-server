import { FastifyReply, FastifyRequest, RouteOptions } from 'fastify';
import comicsController from '../controllers/comics.controller';

const { handleSearch } = comicsController();

interface FiltersQuery {
    genres: number;
}

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
            genres: { type: 'integer' },
        },
    },
    handler: function (req: FastifyRequest, res: FastifyReply) {
        const { genres } = req.query as FiltersQuery;

        res.send({
            data: `Hello from comics filter ${genres}`,
        });
    },
};

const comicsRoute = [comicSearchRoute, comicFiltersRoute];
export default comicsRoute;
