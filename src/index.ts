import fastify from 'fastify';
import { PORT } from './configs';
import routes from './routes';
import dotenv from 'dotenv';
import tasks from './services/cron.service';
import cors from '@fastify/cors';
import { voteSchema } from './schema/VoteSchema';
dotenv.config();

const server = fastify({ logger: true });

//@ts-ignore
server.register(routes, { prefix: '/api/v2' });

server.addSchema(voteSchema);

server.register(cors, {
    origin: [
        'http://localhost:3000',
        'https://kyotomanga.live',
        'https://uptime-kyotomanga-source-production.up.railway.app',
    ],
});

(async function () {
    try {
        await server.ready();

        const address = await server.listen({ port: PORT });
        console.log(`Server listening at ${address}`);

        tasks.forEach((task) => task.start());
    } catch (err) {
        server.log.error(err);
        process.exit(1);
    }
})();
