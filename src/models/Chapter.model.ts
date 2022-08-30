import mongoose from 'mongoose';
import { mongoDbRemoteClient } from '../configs';
const { Schema } = mongoose;

const ChapterSchema = new Schema({
    comicName: { type: String, index: true, unique: true },
    comicSlug: { type: String, index: true, require: true, unique: true },
    source: { type: String },
    createdAt: { type: Date, default: Date.now },
    chapters_list: [
        {
            sourceName: { type: String },
            chapters: [
                {
                    chapterId: { type: String },
                    chapterSlug: { type: String },
                    chapterNumber: { type: String },
                    chapterTitle: { type: String },
                    updatedAt: { type: String },
                    view: { type: String },
                },
            ],
        },
    ],
});

export default mongoDbRemoteClient.model('chapters', ChapterSchema);
