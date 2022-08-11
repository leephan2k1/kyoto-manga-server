import { DoneFuncWithErrOrRes, FastifyInstance, RouteOptions } from 'fastify';
import comicsRoutes from './comics.route';

export default function routes(
    fastify: FastifyInstance,
    options: RouteOptions,
    done: DoneFuncWithErrOrRes,
) {
    comicsRoutes.forEach((route) => {
        fastify.route(route);
    });

    done();
}
