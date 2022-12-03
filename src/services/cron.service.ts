import cron, { ScheduledTask } from 'node-cron';
import updateComics, {
    updateSeasonalComics,
    updateNewReleaseComics,
    updateNewUpdatedComics,
} from './updateComic.service';

const tasks: ScheduledTask[] = [];

tasks.push(
    cron.schedule('0 */3 * * *', () => {
        console.log('update real time comics every 3 hours');
        (async function () {
            try {
                await Promise.allSettled(
                    updateComics.map(async (cb) => {
                        await cb();
                    }),
                );
            } catch (err) {}
        })();
    }),
);

tasks.push(
    cron.schedule('*/59 * * * *', () => {
        console.log('update real time comics every 59m');
        (async function () {
            try {
                await Promise.allSettled(
                    [updateNewReleaseComics, updateNewUpdatedComics].map(
                        async (cb) => {
                            await cb();
                        },
                    ),
                );
            } catch (err) {}
        })();
    }),
);

tasks.push(
    cron.schedule('0 0 1 */3 *', () => {
        console.log('update seasonal comics every 3rd month');
        (async function () {
            try {
                await updateSeasonalComics();
            } catch (err) {}
        })();
    }),
);

export default tasks;
