import { Comic, Source_Type } from 'types';

import { LhURL, NtURL, OtkUrl } from '../configs';
import lhModel from '../models/Lh.model';
import NtcModel from '../models/Ntc.model';
import OTKModel from '../models/Otk.model';

const Nt = NtcModel.Instance(NtURL);
const Lh = lhModel.Instance(LhURL, 30000);
const Otk = OTKModel.Instance(OtkUrl);

export default function ComicsCenter() {
    return {
        getComics: async (data: Comic[]) => {
            try {
                if (data) {
                    return await Promise.allSettled(
                        data.map(async (e) => {
                            if (!e.sourcesAvailable) {
                                e.sourcesAvailable = [];
                            }

                            const LHRes = await Lh.search(e.name);
                            if (LHRes) {
                                e.sourcesAvailable.push({
                                    sourceName: 'LHM',
                                    sourceSlug: LHRes.url,
                                });
                            }

                            const OtkRes = await Otk.search(e.name);
                            if (OtkRes?.length && OtkRes[0]?.slug) {
                                e.sourcesAvailable.push({
                                    sourceName: 'OTK',
                                    sourceSlug:
                                        (process.env.OTK_SOURCE_URL as string) +
                                        OtkRes[0].slug,
                                });
                            }

                            return e;
                        }),
                    );
                }
            } catch (err) {
                console.log(err);
            }
        },

        getChapter: async (comicSlug: string, source: Source_Type) => {
            try {
                switch (source) {
                    case 'LHM':
                        return Lh.getChapters(comicSlug);
                    case 'NTC':
                        return Nt.getChapters(comicSlug);
                    case 'OTK':
                        return Otk.getChapters(comicSlug);
                }
            } catch (err) {
                console.log(`error get chapter ${err}`);
                return [];
            }
        },

        getPages: async (chapterSlug: string, source: Source_Type) => {
            try {
                switch (source) {
                    case 'LHM':
                        return Lh.getChapterPages(chapterSlug);
                    case 'NTC':
                        return Nt.getChapterPages(chapterSlug);
                    case 'OTK':
                        return Otk.getChapterPages(chapterSlug);
                }
            } catch (err) {
                console.log(`error get pages ${err}`);
                return [];
            }
        },
    };
}
