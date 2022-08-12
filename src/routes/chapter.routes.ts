import { RouteOptions, FastifyRequest, FastifyReply } from 'fastify';
import chaptersController from '../controllers/chapters.controller';

const { handleGetChapter } = chaptersController();

export const chapterInfoRoute: RouteOptions = {
    url: '/chapters/:chapterSlug',
    method: 'GET',
    handler: async (req: FastifyRequest, rep: FastifyReply) => {
        rep.status(200).send({
            message: 'send from chapterSlug route',
        });
    },
};

const chapterRoutes = [chapterInfoRoute];
export default chapterRoutes;
