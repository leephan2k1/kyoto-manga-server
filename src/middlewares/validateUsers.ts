import { FastifyReply, FastifyRequest } from 'fastify';
import User from '../models/User.model';

export async function validateUsers(req: FastifyRequest, rep: FastifyReply) {
    try {
        // @ts-ignore
        const { userId } = req.params;

        if (!String(userId).match(/^[0-9a-fA-F]{24}$/)) {
            return rep.status(403).send({
                status: 'forbidden',
                message: `${userId} not matched with ObjectId`,
            });
        }

        const existUser = await User.findById(userId);

        if (!existUser) {
            return rep.status(403).send({
                status: 'forbidden',
                message: `${userId} not in database`,
            });
        }
    } catch (error) {}
}
