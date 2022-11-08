import { FastifyReply, FastifyRequest } from 'fastify';
import Comment from '../models/Comment.model';
import Notification from '../models/Notification.model';
import { cleanContents } from '../utils/stringHandler';
import { reactionTypes, reactionOptions } from '../constants';
import mongoose from 'mongoose';
import server from '../index';
import User from '../models/User.model';

interface CreateBodyComment {
    comicSlug: string;
    comicName: string;
    contents: string;
    section: string;
    isSpoil?: boolean;
}

interface ReplyBodyComment {
    replyTo: string;
    contents: string;
    isSpoil: string;
}

interface CreateParamsComment {
    userId: string;
}

interface DeleteParamsComment extends CreateParamsComment {
    commentId: string;
}

interface CommentsQueryParams {
    comicSlug: string;
    section: string;
    order: string;
    orderBy: string;
    limit: number;
    page: number;
}

interface ReactionBody {
    options: 'up' | 'down';
    reactionType: 'clown_face' | 'thumbs_up' | 'heart' | 'enraged_face';
}

export async function handleCreateComment(
    req: FastifyRequest,
    rep: FastifyReply,
) {
    try {
        const { userId } = req.params as CreateParamsComment;
        const { comicName, comicSlug, contents, isSpoil, section } =
            req.body as CreateBodyComment;

        await Comment.create({
            comicSlug,
            comicName,
            contents: cleanContents(contents),
            owner: userId,
            isSpoil,
            section,
        });

        rep.status(201).send({
            status: 'success',
        });
    } catch (error) {
        console.log('error::: ', error);
        rep.status(500).send({ status: 'error' });
    }
}

export async function handleGetComments(
    req: FastifyRequest,
    rep: FastifyReply,
) {
    try {
        const { comicSlug, section, limit, order, orderBy, page } =
            req.query as CommentsQueryParams;

        if (!comicSlug || !section) {
            return rep.status(400).send({
                status: 'error',
                message: `comicSlug & section are required`,
            });
        }

        const comments = await Comment.find({
            comicSlug,
            section,
            replyTo: { $eq: undefined },
        })
            // @ts-ignore
            .sort({
                [orderBy]: order,
            })
            .limit(limit)
            .skip((page - 1) * limit)
            .populate('owner', { emailVerified: 0, email: 0 })
            .populate({
                path: 'replies',
                populate: {
                    path: 'owner',
                    select: { emailVerified: 0, email: 0 },
                },
            });

        rep.status(200).send({ status: 'success', comments });
    } catch (error) {
        console.log('error::: ', error);
        rep.status(500).send({ status: 'error' });
    }
}

export async function handleReply(req: FastifyRequest, rep: FastifyReply) {
    try {
        const { userId } = req.params as CreateParamsComment;
        const { contents, isSpoil, replyTo } = req.body as ReplyBodyComment;

        const commentIsReplied = await Comment.findById(replyTo);

        if (!commentIsReplied) {
            return rep.status(404).send({
                status: 'not found',
                message: `${replyTo} is not available in DB`,
            });
        }

        const { comicSlug, comicName, section, owner, _id } = commentIsReplied;

        const reply = await Comment.create({
            comicSlug,
            comicName,
            section,
            isSpoil,
            replyTo: _id,
            contents: cleanContents(contents),
            owner: userId,
        });

        await commentIsReplied.updateOne({
            $addToSet: { replies: [reply._id] },
        });

        if (String(owner) !== String(userId)) {
            await Notification.create({
                owner,
                comment: _id,
                response: userId,
            });

            const ownerWasReplied = await User.findById(owner);

            if (
                ownerWasReplied?.socketIds &&
                Array.isArray(ownerWasReplied?.socketIds)
            ) {
                ownerWasReplied?.socketIds.map((socketId) => {
                    server.io.to(socketId).emit('hasReply', { ping: true });
                });
            }
        }

        rep.status(201).send({ status: 'success' });
    } catch (error) {
        console.log('error::: ', error);
        rep.status(500).send({ status: 'error' });
    }
}

export async function handleDeleteComment(
    req: FastifyRequest,
    rep: FastifyReply,
) {
    try {
        const { commentId } = req.params as DeleteParamsComment;

        // remove 1-n relationships
        const commentShouldRm = await Comment.findById(commentId);
        // @ts-ignore
        const { replyTo, replies } = commentShouldRm;

        await Promise.allSettled(
            Array.from([replyTo, replies]).map(async (action) => {
                if (!action) return;
                // remove replies
                if (Array.isArray(action)) {
                    console.log('replies:: ', action);

                    await Comment.deleteMany({ _id: { $in: action } });
                } else {
                    console.log('replyTo:: ', action);

                    await Comment.findByIdAndUpdate(action, {
                        $pull: {
                            replies: { $in: [commentId] },
                        },
                    });
                }
            }),
        );

        await Promise.allSettled([
            await commentShouldRm?.remove(),
            await Notification.deleteMany({
                comment: new mongoose.Types.ObjectId(commentId),
            }),
        ]);

        return rep.status(200).send({ status: 'success' });
    } catch (error) {
        console.log('error::: ', error);
        rep.status(500).send({ status: 'error' });
    }
}

export async function handleEditComment(
    req: FastifyRequest,
    rep: FastifyReply,
) {
    try {
        const { commentId } = req.params as Pick<
            DeleteParamsComment,
            'commentId'
        >;

        const { contents, isSpoil } = req.body as Pick<
            CreateBodyComment,
            'contents' | 'isSpoil'
        >;

        await Comment.findByIdAndUpdate(commentId, {
            $set: {
                contents: cleanContents(contents),
                isSpoil,
                lastEdited: Date.now(),
            },
        });

        return rep.status(200).send({ status: 'success' });
    } catch (error) {
        console.log('error::: ', error);
        rep.status(500).send({ status: 'error' });
    }
}

export async function handleReaction(req: FastifyRequest, rep: FastifyReply) {
    try {
        const { options, reactionType } = req.body as ReactionBody;
        const { commentId, userId } = req.params as Pick<
            DeleteParamsComment,
            'commentId' | 'userId'
        >;

        const comment = await Comment.findById(commentId);

        if (!comment) {
            return rep.status(404).send({ status: 'not found' });
        }

        if (!reactionTypes.find((type) => type === reactionType)) {
            return rep.status(400).send({
                status: 'error',
                message: `reactions must be follow this types: ${reactionTypes}`,
            });
        }

        if (!reactionOptions.find((opt) => opt === options)) {
            return rep.status(400).send({
                status: 'error',
                message: `reactions must be follow this types: ${reactionOptions}`,
            });
        }

        const reactionField = `reactions.${reactionType}`;

        if (options === 'up') {
            await comment.updateOne({
                $addToSet: {
                    [reactionField]: [userId],
                },
            });
        } else {
            await comment.updateOne({
                $pull: {
                    [reactionField]: { $in: [userId] },
                },
            });
        }

        return rep.status(200).send({ status: 'success' });
    } catch (error) {
        console.log('error::: ', error);
        rep.status(500).send({ status: 'error' });
    }
}

export async function handleGetRecentlyComments(
    req: FastifyRequest,
    rep: FastifyReply,
) {
    try {
        const { limit } = req.query as Pick<CommentsQueryParams, 'limit'>;

        const comments = await Comment.find({
            replyTo: { $eq: undefined },
        })
            .populate('owner')
            .sort({ createdAt: -1 })
            .limit(limit);

        return rep.status(200).send({ status: 'success', comments });
    } catch (error) {
        console.log('error::: ', error);
        rep.status(500).send({ status: 'error' });
    }
}
