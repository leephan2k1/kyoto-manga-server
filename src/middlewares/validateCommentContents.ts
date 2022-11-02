import { FastifyReply, FastifyRequest, DoneFuncWithErrOrRes } from 'fastify';

export function validateContents(
    req: FastifyRequest,
    rep: FastifyReply,
    done: DoneFuncWithErrOrRes,
) {
    // @ts-ignore
    const { contents, comicSlug } = req.body;

    if (!comicSlug || !contents) {
        return rep.status(400).send({
            status: 'error',
            message: `comicSlug or contents is required`,
        });
    }

    done();
}
