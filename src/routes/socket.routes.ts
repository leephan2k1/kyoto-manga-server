import { FastifyInstance } from 'fastify';
import { setSocketId, removeSocketId } from '../controllers/sockets.controller';

export default function socketRoute(fastify: FastifyInstance) {
    fastify.io.on('connection', (socket) => {
        console.log('SOCKETTTTTTTTTTT:: ', socket.id);

        socket.on('online-emitter', (data) => {
            setSocketId(data.userId, socket.id);
        });

        socket.on('disconnect', () => {
            removeSocketId(socket.id);
        });
    });
}
