import mongoose from 'mongoose';
import { mongoDbRemoteAuthClient } from '../configs';
const { Schema } = mongoose;

const CommentSchema = new Schema(
    {
        comicSlug: { type: String, index: true, require: true },
        comicName: { type: String, require: true },
        section: { type: String, require: true, index: true },
        contents: { type: String, require: true },
        owner: { type: Schema.Types.ObjectId, require: true, ref: 'users' },
        replyTo: { type: Schema.Types.ObjectId },
        replies: [
            {
                type: Schema.Types.ObjectId,
                ref: 'comments',
            },
        ],
        lastEdited: { type: Date },
        isSpoil: { type: Boolean },
        reactions: {
            clown_face: [{ type: Schema.Types.ObjectId }],
            thumbs_up: [{ type: Schema.Types.ObjectId }],
            heart: [{ type: Schema.Types.ObjectId }],
            enraged_face: [{ type: Schema.Types.ObjectId }],
        },
    },
    { timestamps: true },
);

export default mongoDbRemoteAuthClient.model('comments', CommentSchema);
