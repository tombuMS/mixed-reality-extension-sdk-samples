/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import App from './app';
import mediaConfigSchema from './mediaConfigSchema.json';
import { validate } from 'jsonschema';
import { VideoMedia, ImageMedia, StreamingMediaLike } from './media';
import { VideoConfig, ImageConfig } from './mediaConfig';

export default class MediaManager {
    private _loopMediaList = false;    
    private _mediaList: StreamingMediaLike[] = null;
    private _currentMediaIdx: number = null;

    public get loopMediaList() { return this._loopMediaList; }
    public set loopMediaList(value: boolean) { this._loopMediaList = value; }

    public get configured() { return this._mediaList !== null; }

    public constructor(private _app: App) {

    }

    public validateConfigJson(jsonData: any): boolean {
        const result = validate(jsonData, mediaConfigSchema);
        return result.valid;
    }

    public async setMediaConfigJson(jsonData: any): Promise<boolean> {
        this._mediaList = null;

        if (!this.validateConfigJson(jsonData)) {
            console.log("Media configuration JSON has invalid format.  Aborting.");
            return false;
        }

        if (jsonData.loopMediaList) { this._loopMediaList = jsonData.loopMediaList; }
        if (jsonData.mediaList) { 
            const assetsLoading: Promise<void>[] = [];
            this._mediaList = [];
            const mediaList = jsonData.mediaList;
            for(var media in mediaList) {
                let newMedia: StreamingMediaLike = null;
                if (mediaList[media].videoUrl) {
                    newMedia = new VideoMedia(mediaList[media] as VideoConfig);
                } else if(mediaList[media].imageUrl) {
                    newMedia = new ImageMedia(mediaList[media] as ImageConfig);
                } else {
                    console.log("Invalid media type in the json media list.");
                    return false;
                }

                assetsLoading.push(newMedia.preloadAssets(this._app.assets));
                this._mediaList.push(newMedia);
            }

            await Promise.all(assetsLoading);

            // Only set the current index to 
            if (this._mediaList.length > 0) { this._currentMediaIdx = 0; }
            return true;
        }

        return false;
    }

    public currentMedia(): StreamingMediaLike {
        if (this._mediaList.length === 0 || this._currentMediaIdx < 0 && this._currentMediaIdx >= this._mediaList.length) {
            return null;
        }

        return this._mediaList[this._currentMediaIdx];
    }

    public perviousMedia(): StreamingMediaLike {
        if (this._mediaList.length === 0) {
            return null;
        }

        if (this._loopMediaList) {
            this._currentMediaIdx = (--this._currentMediaIdx < 0) ? this._mediaList.length - 1 : this._currentMediaIdx;
        } else {
            if (--this._currentMediaIdx < 0) {
                // There is no previous video so don't to do anything.
                this._currentMediaIdx = 0;
                return null;
            }
        }
        
        if (this._currentMediaIdx < this._mediaList.length && this._currentMediaIdx >= 0) {
            return this._mediaList[this._currentMediaIdx];
        }

        return null;
    }

    public nextMedia(): StreamingMediaLike {
        if (this._mediaList.length === 0) {
            return null;
        }

        if (this._loopMediaList) {
            this._currentMediaIdx = ++this._currentMediaIdx % this._mediaList.length;
        } else {
            if (this._currentMediaIdx == this._mediaList.length) {
                // We are already one past the end of the media set.  Do nothing.
                return null;
            }
            ++this._currentMediaIdx;
        }
        
        if (this._currentMediaIdx < this._mediaList.length && this._currentMediaIdx >= 0) {
            return this._mediaList[this._currentMediaIdx];
        }

        return null;
    }
}