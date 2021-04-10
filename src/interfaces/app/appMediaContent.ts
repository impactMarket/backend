import { AppMediaThumbnail } from './appMediaThumbnail';

export interface AppMediaContent {
    id: number;
    url: string;
    width: number;
    height: number;

    thumbnails?: AppMediaThumbnail[];
}
export interface AppMediaContentCreation {
    url: string;
    width: number;
    height: number;
}
