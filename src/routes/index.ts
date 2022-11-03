import { DoneFuncWithErrOrRes, FastifyInstance, RouteOptions } from 'fastify';
import comicRoutes from './comic.routes';
import chapterRoutes from './chapter.routes';
import commentRoutes from './comment.routes';
import userRoutes from './user.routes';
import { proxyHandler } from '../controllers/proxy.controller';

export default function routes(
    fastify: FastifyInstance,
    options: RouteOptions,
    done: DoneFuncWithErrOrRes,
) {
    comicRoutes.forEach((route) => {
        fastify.route(route);
    });

    chapterRoutes.forEach((route) => {
        fastify.route(route);
    });

    commentRoutes.forEach((route) => {
        fastify.route(route);
    });

    userRoutes.forEach((route) => {
        fastify.route(route);
    });

    fastify.route({
        url: '/proxy',
        method: 'GET',
        schema: {
            querystring: {
                src: { type: 'string' },
                url: { type: 'string' },
            },
        },
        handler: proxyHandler,
    } as RouteOptions);

    done();
}
