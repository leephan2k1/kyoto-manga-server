import cron, { ScheduledTask } from 'node-cron';
import updateComics, {
    updateThumbnail,
    updateSeasonalComics,
} from './updateComic.service';

const tasks: ScheduledTask[] = [];

tasks.push(
    cron.schedule('*/59 * * * *', () => {
        console.log('update real time comics every 59m');
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
    cron.schedule('*/45 * * * *', () => {
        console.log('update thumbnail comics every 45m');
        (async function () {
            try {
                await updateThumbnail();
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
