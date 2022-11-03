import mongoose from 'mongoose';
import { mongoDbRemoteAuthClient } from '../configs';
const { Schema } = mongoose;

const NotificationSchema = new Schema(
    {
        owner: {
            type: Schema.Types.ObjectId,
            require: true,
            index: true,
            ref: 'users',
        },
        comment: {
            type: Schema.Types.ObjectId,
            require: true,
            index: true,
            ref: 'comments',
        },
        response: {
            type: Schema.Types.ObjectId,
            require: true,
            ref: 'users',
        },
        seen: { type: Date },
        createdAt: {
            type: Date,
            expires: 60 * 60 * 24 * 7,
            default: Date.now(),
        }, // 7 days
    },
    { timestamps: true },
);

export default mongoDbRemoteAuthClient.model(
    'notifications',
    NotificationSchema,
);
