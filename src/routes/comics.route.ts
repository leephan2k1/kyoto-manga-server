import { FastifyReply, FastifyRequest, RouteOptions } from 'fastify';

interface FiltersQuery {
    genres: number;
}

export const comicSearchRoute: RouteOptions = {
    url: '/comics/search',
    method: 'GET',
    handler: function (req: FastifyRequest, res: FastifyReply) {
        res.send({
            data: 'Hello from comics search',
        });
    },
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
