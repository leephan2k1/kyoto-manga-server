import fastify from 'fastify';
import { PORT } from './configs';
import routes from './routes';

const server = fastify();

//@ts-ignore
server.register(routes, { prefix: '/api/v2' });

server.get('/ping', async (request, reply) => {
    return { hello: 'world' };
});

server.listen({ port: PORT }, (err, address) => {
    if (err) {
        console.error(err);
        process.exit(1);
    }
    console.log(`Server listening at ${address}`);
});
