import { RouteOptions, FastifyRequest, FastifyReply } from 'fastify';
import chaptersController from '../controllers/chapters.controller';

const { handleGetPages } = chaptersController();

export const chapterInfoRoute: RouteOptions = {
    url: '/chapters',
    method: 'POST',
    schema: {
        body: {
            type: 'object',
            properties: {
                source: { type: 'string' },
                chapterSlug: { type: 'string' },
                comicName: { type: 'string' },
                comicSlug: { type: 'string' },
            },
        },
    },
    handler: handleGetPages,
};

const chapterRoutes = [chapterInfoRoute];
export default chapterRoutes;
