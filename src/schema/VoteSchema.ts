export const voteSchema = {
    $id: 'voteSchema',
    type: 'object',
    properties: {
        userId: {
            type: 'string',
        },
        comicName: {
            type: 'string',
        },
        comicSlug: {
            type: 'string',
        },
    },
    required: ['userId', 'comicName'],
};
