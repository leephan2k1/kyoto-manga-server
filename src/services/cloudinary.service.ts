import { cloudinaryClient } from '../configs';
import logEvents from '../utils/logEvents';

export async function uploadImage(imgSrc: string, tracking_id: string) {
    try {
        const res = await cloudinaryClient.uploader.upload(imgSrc, {
            upload_preset: 'comics_preset',
        });

        return res.secure_url;
    } catch (err) {
        logEvents('cloudinary', `upload ${tracking_id} failed`);
        console.log('upload to cloudinary failed!');
        return imgSrc;
    }
}
