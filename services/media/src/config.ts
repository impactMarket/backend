export default {
    aws: {
        accessKeyId: process.env.E_AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.E_AWS_SECRET_ACCESS_KEY!,
        region: process.env.E_AWS_REGION!,
        bucket: {
            community: process.env.E_AWS_BUCKET_COMMUNITY!,
            story: process.env.E_AWS_BUCKET_STORY!,
            profile: process.env.E_AWS_BUCKET_PROFILE!,
        },
    },

    cloudfrontUrl: process.env.CLOUDFRONT_URL!,

    thumbnails: {
        story: [
            {
                width: 94,
                height: 148,
            },
            {
                width: 84,
                height: 140,
            },
        ],
        community: {
            cover: [
                {
                    width: 392,
                    height: 392,
                },
                {
                    width: 293,
                    height: 293,
                },
                {
                    width: 88,
                    height: 88,
                },
                {
                    width: 330,
                    height: 330,
                },
                {
                    width: 42,
                    height: 42,
                },
                {
                    width: 294,
                    height: 294,
                },
            ],
        },
        promoter: {
            logo: [
                {
                    width: 100,
                    height: 100,
                },
            ],
        },
        profile: [
            {
                width: 42,
                height: 42,
            },
            {
                width: 80,
                height: 80,
            },
        ],
        pixelRatio: [1, 2],
    },
};
