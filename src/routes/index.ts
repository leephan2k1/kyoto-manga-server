import { DoneFuncWithErrOrRes, FastifyInstance, RouteOptions } from 'fastify';
import comicRoutes from './comic.routes';
import chapterRoutes from './chapter.routes';

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

    done();
}
