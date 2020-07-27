/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

 import * as MRE from '@microsoft/mixed-reality-extension-sdk';
import App from './app';
import mediaConfigSchema from './mediaConfigSchema.json';
import { validate } from 'jsonschema';
import { VideoMedia, ImageMedia, StreamingMediaLike } from './media';
import { VideoConfig, ImageConfig } from './mediaConfig';
import * as fs from 'fs';

export default class MediaManager {
    private _loopMediaList = false;    
    private _mediaList: StreamingMediaLike[] = null;
    private _currentMediaIdx: number = null;
    private _configStoreBasePath = "";
    private _configSessionDir = "";
    private _loadingInitConfig = false;

    public get loopMediaList() { return this._loopMediaList; }
    public set loopMediaList(value: boolean) { this._loopMediaList = value; }

    public get configured() { return this._mediaList !== null; }
    public get loadingInitConfig() { return this._loadingInitConfig; }

    public constructor(private _app: App) {
        this._configStoreBasePath = process.env.CONFIG_STORE_PATH ?? "./_data";
        if (!fs.existsSync(this._configStoreBasePath)) {
            console.log(`Config path directory does not exist.  Create new directory: ${this._configStoreBasePath}`);
            fs.mkdirSync(this._configStoreBasePath);
        }

        // Initialize media manager if there is a config stored for this session id.
        this._configSessionDir = `${this._configStoreBasePath}/${_app.context.sessionId}`;
        if (fs.existsSync(this._configSessionDir)) {
            const configFileName = fs.readdirSync(this._configSessionDir).find(file => file.endsWith('.json'));
            this._loadingInitConfig = true;
            this.loadConfigFile(`${this._configSessionDir}/${configFileName}`).then(_ => this._loadingInitConfig = false);

            // Set the media player owner id to the name of the file, as it was named for the configured owner id.
            _app.userManager.setMediaPlayerOwner(MRE.parseGuid(configFileName.slice(0, -5)));
        }
    }

    public async loadMediaConfig(user: MRE.User): Promise<boolean> {
        const configFilePath = `${this._configSessionDir}/${user.id}.json`;
        return this.loadConfigFile(configFilePath);
    }

    public validateConfigJson(jsonData: any): boolean {
        const result = validate(jsonData, mediaConfigSchema);
        return result.valid;
    }

    public async setMediaConfigJson(jsonString: string, user: MRE.User): Promise<boolean> {
        try {
            const jsonData = JSON.parse(jsonString);

            if (!this.validateConfigJson(jsonData)) {
                console.log("Media configuration JSON has invalid format.  Aborting.");
                return false;
            }

            // Store the media config as sessionID:userID.json
            const configDirPath = `${this._configStoreBasePath}/${this._app.context.sessionId}`;
            const configFileName = `${configDirPath}/${user.id}.json`;
            console.log(`Writing json config to file: ${configFileName}`);
            console.log(`Contents of JSON:\n${jsonString}`);

            if (!fs.existsSync(configDirPath)) {
                fs.mkdirSync(configDirPath);
            }

            fs.writeFileSync(configFileName, jsonString, {
                encoding: "utf8",
                mode: 666,
                flag: "w"
            });

            return this.configureMedia(jsonData);
        } catch {
            console.log("Submitted invalid json string.  Did not parse.");
            return false;
        }
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

    private async loadConfigFile(userConfigPath: string): Promise<boolean> {
        if (fs.existsSync(userConfigPath)) {
            try {
                const jsonData = JSON.parse(fs.readFileSync(userConfigPath, { encoding: "utf8"}));
                if (jsonData) {
                    if (!this.validateConfigJson(jsonData)) {
                        console.log("Media configuration JSON has invalid format.  Aborting.");
                        return false;
                    }
    
                    return this.configureMedia(jsonData);
                }
            } catch {
                console.log(`Failed to parse the stored JSON. Config file invalid: ${this._configStoreBasePath}`)
                return false;
            }
            
        }
        
        return false;
    }

    private async configureMedia(jsonData: any): Promise<boolean> {
        this._mediaList = null;

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

            try {
                await Promise.all(assetsLoading);

                // Only set the current index to 
                if (this._mediaList.length > 0) { this._currentMediaIdx = 0; }
                return true;
            } catch {
                console.log("Error loading assets on client.");
                return false;
            }
        }

        return false;
    }
}