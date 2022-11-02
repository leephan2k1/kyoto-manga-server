import { FastifyReply, FastifyRequest } from 'fastify';
import Comment from '../models/Comment.model';
import { cleanContents } from '../utils/stringHandler';
import { reactionTypes, reactionOptions } from '../constants';

interface CreateBodyComment {
    comicSlug: string;
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

interface ReactionQueryParams {
    options: 'up' | 'down';
    reactionType: 'clown_face' | 'thumbs_up' | 'heart' | 'enraged_face';
}

export async function handleCreateComment(
    req: FastifyRequest,
    rep: FastifyReply,
) {
    try {
        const { userId } = req.params as CreateParamsComment;
        const { comicSlug, contents, isSpoil, section } =
            req.body as CreateBodyComment;

        await Comment.create({
            comicSlug,
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

        const comments = await Comment.find({ comicSlug, section })
            // @ts-ignore
            .sort({
                [orderBy]: order,
            })
            .limit(limit)
            .skip((page - 1) * limit)
            .populate('owner')
            .populate({
                path: 'replies',
                populate: {
                    path: 'owner',
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

        const { comicSlug, section } = commentIsReplied;

        const reply = await Comment.create({
            comicSlug,
            section,
            isSpoil,
            contents: cleanContents(contents),
            owner: userId,
        });

        await commentIsReplied.updateOne({
            $addToSet: { replies: [reply._id] },
        });

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

        await Comment.findByIdAndDelete(commentId);

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

        const { contents } = req.body as Pick<CreateBodyComment, 'contents'>;

        await Comment.findByIdAndUpdate(commentId, {
            $set: { contents: cleanContents(contents), lastEdited: Date.now() },
        });

        return rep.status(200).send({ status: 'success' });
    } catch (error) {
        console.log('error::: ', error);
        rep.status(500).send({ status: 'error' });
    }
}

export async function handleReaction(req: FastifyRequest, rep: FastifyReply) {
    try {
        const { options, reactionType } = req.query as ReactionQueryParams;
        const { commentId } = req.params as Pick<
            DeleteParamsComment,
            'commentId'
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

        const { reactions, totalReactions } = comment;

        if (options === 'up') {
            await comment.updateOne({
                $set: {
                    totalReactions: totalReactions + 1,
                    reactions: {
                        ...reactions,
                        [reactionType]:
                            reactions && reactions[reactionType] + 1,
                    },
                },
            });
        } else {
            await comment.updateOne({
                $set: {
                    totalReactions:
                        totalReactions > 0 &&
                        reactions &&
                        reactions[reactionType] > 0
                            ? totalReactions - 1
                            : totalReactions,
                    reactions: {
                        ...reactions,
                        [reactionType]:
                            reactions && reactions[reactionType] > 0
                                ? reactions[reactionType] - 1
                                : 0,
                    },
                },
            });
        }

        return rep.status(200).send({ status: 'success' });
    } catch (error) {
        console.log('error::: ', error);
        rep.status(500).send({ status: 'error' });
    }
}
