import axios from 'axios';
import { FastifyReply, FastifyRequest } from 'fastify';

interface ProxyQuery {
    src: string;
    url: string;
}

export async function proxyHandler(req: FastifyRequest, res: FastifyReply) {
    try {
        const { src, url } = req.query as ProxyQuery;

        const options = {
            responseType: 'stream',
            headers: {
                referer: String(url),
            },
        } as const;

        const response = await axios.get(String(src), options);

        return res.send(response.data);
    } catch (err) {
        res.status(400).send({
            message: `Bad request ${err}`,
        });
    }
}
