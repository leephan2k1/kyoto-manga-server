import mongoose from 'mongoose';
import { mongoDbRemoteAuthClient } from '../configs';
const { Schema } = mongoose;

const CommentSchema = new Schema(
    {
        comicSlug: { type: String, index: true, require: true },
        section: { type: String, require: true, index: true },
        contents: { type: String, require: true },
        owner: { type: Schema.Types.ObjectId, require: true, ref: 'users' },
        replies: [
            {
                type: Schema.Types.ObjectId,
                ref: 'comments',
            },
        ],
        lastEdited: { type: Date },
        isSpoil: { type: Boolean },
        totalReactions: { type: Number, default: 0 },
        reactions: {
            clown_face: { type: Number, default: 0 },
            thumbs_up: { type: Number, default: 0 },
            heart: { type: Number, default: 0 },
            enraged_face: { type: Number, default: 0 },
        },
    },
    { timestamps: true },
);

export default mongoDbRemoteAuthClient.model('comments', CommentSchema);
