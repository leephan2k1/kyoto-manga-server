import { DoneFuncWithErrOrRes, FastifyInstance, RouteOptions } from 'fastify';
import comicsRoute from './comics.route';

export default function routes(
    fastify: FastifyInstance,
    options: RouteOptions,
    done: DoneFuncWithErrOrRes,
) {
    comicsRoute.forEach((route) => {
        fastify.route(route);
    });

    done();
}
