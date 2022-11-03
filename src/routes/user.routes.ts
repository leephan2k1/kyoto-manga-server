import { RouteOptions } from 'fastify';
import {
    getUserNotifications,
    setSeenStateNotification,
} from '../controllers/users.controller';
import { validateUsers } from '../middlewares/validateUsers';

const userRoutes: RouteOptions[] = [
    {
        url: '/users/:userId/notifications',
        method: 'GET',
        schema: {
            querystring: {
                order: { type: 'string', default: 'desc' },
                limit: { type: 'number', default: 10 },
            },
        },
        preHandler: [validateUsers],
        handler: getUserNotifications,
    },
    {
        url: '/users/:userId/notifications',
        method: 'POST',
        schema: {
            body: {
                type: 'object',
                properties: {
                    notificationId: { type: 'string' },
                },
                required: ['notificationId'],
            },
        },
        preHandler: [validateUsers],
        handler: setSeenStateNotification,
    },
];

export default userRoutes;
