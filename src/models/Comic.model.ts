import mongoose from 'mongoose';

import { mongoDbRemoteClient } from '../configs';

const { Schema } = mongoose;

export const comicSchema = {
    custom_id: { type: Number },
    status: {
        type: String,
        require: true,
    },
    author: {
        type: String,
        require: true,
    },
    genres: [
        {
            id: String,
            value: String,
            label: String,
        },
    ],
    otherName: {
        type: String,
        require: true,
    },
    review: {
        type: String,
        require: true,
    },
    newChapter: {
        type: String,
        require: true,
    },
    chapters: {
        type: Schema.Types.ObjectId,
        ref: 'chapters',
    },
    description: {
        type: Schema.Types.ObjectId,
        ref: 'descriptions',
    },
    thumbnail: {
        type: String,
        require: true,
    },
    name: {
        type: String,
        require: true,
        index: true,
        unique: true,
    },
    updatedAt: {
        type: String,
        require: true,
    },
    slug: {
        type: String,
        require: true,
        index: true,
        unique: true,
    },
    sourcesAvailable: [
        {
            sourceName: {
                type: String,
            },
            sourceSlug: {
                type: String,
            },
        },
    ],
    createdAt: {
        type: Date,
    },
};

const ComicSchema = new Schema(comicSchema);

export default mongoDbRemoteClient.model('comics', ComicSchema);
