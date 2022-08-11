const fs = require('fs').promises;
import path from 'path';
import { format } from 'date-fns';

const logEvents = async (fileN: string, msg: string) => {
    const fileName = path.join(__dirname, '../logs', fileN + '.log');
    const dateTimes = `${format(new Date(), 'dd-MM-YYY\tHH:mm:ss')}`;
    const contentLog = `${dateTimes} --- ${msg}\n`;

    try {
        fs.appendFile(fileName, contentLog);
    } catch (e) {
        console.error(e);
    }
};

export default logEvents;
