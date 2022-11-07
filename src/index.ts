import fastify from 'fastify';
import { PORT, NGINX_CONFIGS_SUB_PATH } from './configs';
import routes from './routes';
import dotenv from 'dotenv';
import tasks from './services/cron.service';
import cors from '@fastify/cors';
import { voteSchema } from './schema/VoteSchema';
import FastifyWs from 'fastify-socket.io';
import socketRoute from './routes/socket.routes';
dotenv.config();

const server = fastify({ logger: false });

//@ts-ignore
server.register(routes, { prefix: '/api/v2' });

server.addSchema(voteSchema);

server.register(cors, {
    origin: ['http://localhost:3000', 'https://kyotomanga.live'],
});

server.register(FastifyWs, {
    cors: { origin: ['http://localhost:3000', 'https://kyotomanga.live'] },
    path: `${NGINX_CONFIGS_SUB_PATH}/socket.io`,
});

(async function () {
    try {
        await server.ready();

        const address = await server.listen({ port: PORT });
        console.log(`Server listening at ${address}`);

        tasks.forEach((task) => task.start());

        socketRoute(server);
    } catch (err) {
        server.log.error(err);
        process.exit(1);
    }
})();

export default server;
