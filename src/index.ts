import fastify from 'fastify';
import { PORT } from './configs';
import routes from './routes';
import dotenv from 'dotenv';
dotenv.config();

const server = fastify();

//@ts-ignore
server.register(routes, { prefix: '/api/v2' });

(async function () {
    try {
        const address = await server.listen({ port: PORT });
        console.log(`Server listening at ${address}`);
    } catch (err) {
        server.log.error(err);
        process.exit(1);
    }
})();
