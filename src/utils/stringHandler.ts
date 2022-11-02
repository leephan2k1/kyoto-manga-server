import EngFilter from 'bad-words';
// @ts-ignore
import VieFilter from 'vn-badwords';

const escapeRegExpMatch = function (s: string) {
    return s.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
};

export const isExactMatch = (str: string, match: string) => {
    return new RegExp(`\\b${escapeRegExpMatch(match)}\\b`).test(str);
};

export const normalizeString = (str: string) => {
    const htmlTagsRegex = /(&nbsp;|<([^>]+)>)/g;
    return str
        .trim()
        .replace(/(\r\n|\n|\r|\")/gm, '')
        .replace(htmlTagsRegex, '');
};

export function cleanContents(contents: string) {
    const engFilter = new EngFilter();
    const vieFilterRegEx = VieFilter.regexp;

    const cleanContentEng = engFilter.clean(contents);

    const cleanContentVie = cleanContentEng.replace(
        new RegExp(vieFilterRegEx, 'g'),
        '***',
    );

    return cleanContentVie;
}
