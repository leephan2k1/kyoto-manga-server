import { AdminId } from '../configs';
import { FastifyReply, FastifyRequest, DoneFuncWithErrOrRes } from 'fastify';
import Comment from '../models/Comment.model';

export async function validateAdminAndOwner(
    req: FastifyRequest,
    rep: FastifyReply,
) {
    // @ts-ignore
    const { userId, commentId } = req.params;

    if (userId !== AdminId) {
        const comment = await Comment.findById(commentId);

        if (String(comment?.owner) !== String(userId)) {
            return rep
                .status(403)
                .send({ status: 'error', message: 'forbidden' });
        }
    }
}
