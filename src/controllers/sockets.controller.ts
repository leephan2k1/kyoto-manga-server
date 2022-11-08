import User from '../models/User.model';

export async function setSocketId(userId: string, socketId: string) {
    try {
        console.log('setSocketId:: ', userId);
        await User.findByIdAndUpdate(userId, {
            $addToSet: {
                socketIds: [socketId],
            },
        });
        console.log('set socket for user successfully');
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
        console.log('remove socket for user successfully');
    } catch (error) {
        console.error('removeSocketId ERROR: ', error);
    }
}
