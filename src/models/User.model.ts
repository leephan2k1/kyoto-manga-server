import mongoose from 'mongoose';

import { mongoDbRemoteAuthClient } from '../configs';

const { Schema } = mongoose;

const userSchema = {
    name: { type: String },
    email: { type: String },
    image: { type: String },
    socketIds: [{ type: String, index: true }],
};

const UserSchema = new Schema(userSchema);

export default mongoDbRemoteAuthClient.model('users', UserSchema);
