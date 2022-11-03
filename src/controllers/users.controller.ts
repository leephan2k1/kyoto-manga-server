import { FastifyReply, FastifyRequest } from 'fastify';
import Notification from '../models/Notification.model';

interface NotificationsQuery {
    limit: number;
    order: 'asc' | 'desc';
}

export async function getUserNotifications(
    req: FastifyRequest,
    rep: FastifyReply,
) {
    try {
        const { userId } = req.params as { userId: string };
        const { limit, order } = req.query as NotificationsQuery;

        const notifications = await Notification.find({
            owner: userId,
            comment: { $ne: null },
        })
            .limit(limit)
            .sort({ createdAt: order })
            .populate('owner', { name: 1, image: 1, _id: 0 })
            .populate('comment', { comicSlug: 1, comicName: 1, section: 1 })
            .populate('response', { name: 1, image: 1, _id: 0 });

        return rep.status(200).send({ status: 'success', notifications });
    } catch (error) {
        console.log('error: ', error);
        return rep.status(500).send({ status: 'error' });
    }
}

export async function setSeenStateNotification(
    req: FastifyRequest,
    rep: FastifyReply,
) {
    try {
        const { notificationId } = req.body as { notificationId: string };

        await Notification.findByIdAndUpdate(notificationId, {
            $set: { seen: Date.now() },
        });

        return rep.status(200).send({ status: 'success' });
    } catch (error) {
        console.log('error: ', error);
        return rep.status(500).send({ status: 'error' });
    }
}
