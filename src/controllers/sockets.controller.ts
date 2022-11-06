import User from '../models/User.model';

export async function setSocketId(userId: string, socketId: string) {
    try {
        await User.findByIdAndUpdate(userId, {
            $addToSet: {
                socketIds: [socketId],
            },
        });
    } catch (error) {
        console.error('setSocketId ERROR: ', error);
    }
}

export async function removeSocketId(socketId: string) {
    try {
        await User.findOneAndUpdate(
            {
                socketIds: { $in: [socketId] },
            },
            { $pull: { socketIds: socketId } },
        );
    } catch (error) {
        console.error('removeSocketId ERROR: ', error);
    }
}
