import { RouteOptions } from 'fastify';
import {
    handleCreateComment,
    handleGetComments,
    handleReply,
    handleDeleteComment,
    handleEditComment,
    handleReaction,
} from '../controllers/comments.controller';
import { validateContents } from '../middlewares/validateCommentContents';
import { validateUsers } from '../middlewares/validateUsers';
import { validateAdminAndOwner } from '../middlewares/validateAdminAndOwner';

const commentRoutes: RouteOptions[] = [
    {
        url: '/comments',
        method: 'GET',
        schema: {
            querystring: {
                comicSlug: { type: 'string' },
                section: { type: 'string' },
                order: { type: 'string', default: 'desc' },
                orderBy: { type: 'string', default: 'createdAt' },
                limit: { type: 'number', default: 10 },
                page: { type: 'number', default: 1 },
            },
        },
        handler: handleGetComments,
    },
    {
        url: '/comments/:commentId/:userId',
        method: 'DELETE',
        preHandler: [validateUsers, validateAdminAndOwner],
        handler: handleDeleteComment,
    },
    {
        url: '/comments/:commentId/:userId',
        method: 'PATCH',
        schema: {
            body: {
                type: 'object',
                properties: {
                    contents: { type: 'string' },
                },
            },
        },
        preHandler: [validateUsers, validateAdminAndOwner],
        handler: handleEditComment,
    },
    {
        url: '/comments/:userId/create',
        method: 'POST',
        schema: {
            body: {
                type: 'object',
                properties: {
                    comicSlug: { type: 'string' },
                    contents: { type: 'string' },
                    section: { type: 'string' },
                    isSpoil: { type: 'boolean' },
                },
                required: ['comicSlug', 'contents', 'section'],
            },
        },
        preHandler: [validateUsers, validateContents],
        handler: handleCreateComment,
    },
    {
        url: '/comments/:userId/reply',
        method: 'POST',
        schema: {
            body: {
                type: 'object',
                properties: {
                    replyTo: { type: 'string' },
                    contents: { type: 'string' },
                    isSpoil: { type: 'boolean' },
                },
                required: ['replyTo', 'contents'],
            },
        },
        preHandler: [validateUsers],
        handler: handleReply,
    },
    {
        url: '/comments/:commentId/reaction',
        method: 'POST',
        schema: {
            querystring: {
                options: { type: 'string' },
                reactionType: { type: 'string' },
            },
        },
        handler: handleReaction,
    },
];

export default commentRoutes;
