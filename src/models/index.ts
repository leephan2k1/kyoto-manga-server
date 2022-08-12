import NtcModel from '../models/Ntc.model';
import lhModel from '../models/Lh.model';
import OTKModel from '../models/Otk.model';
import { Comic, Source_Type } from 'types';

const Nt = NtcModel.Instance(process.env.NT_SOURCE_URL as string);
const Lh = lhModel.Instance(process.env.LH_SOURCE_URL as string, 30000);
const Otk = OTKModel.Instance(process.env.OTK_SOURCE_URL as string);

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
    };
}
