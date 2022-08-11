import mongoose from 'mongoose';

import { mongoDbRemoteClient } from '../configs';
import { comicSchema } from './Comic.model';

const { Schema } = mongoose;

const RealTimeComicSchema = new Schema({
    type: { type: String, require: true, index: true, unique: true },
    comics: [comicSchema],
});

export default mongoDbRemoteClient.model(
    'real_time_comics',
    RealTimeComicSchema,
);
