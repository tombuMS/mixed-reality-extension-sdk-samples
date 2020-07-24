/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as MRE from '@microsoft/mixed-reality-extension-sdk';
import { ImageConfig, VideoConfig } from "./mediaConfig";
import { VideoStream } from '@microsoft/mixed-reality-extension-sdk';

export enum MediaType {
    Video = 'video',
    Image = 'image'
}

export interface StreamingMediaLike {
    type: MediaType;
    url: string;
    asset: MRE.Asset;
    skipAfter: number;

    preloadAssets(assetContainer: MRE.AssetContainer): Promise<void>;
}

export abstract class StreamingMedia<AssetT extends MRE.Asset> implements StreamingMediaLike {
    protected _asset: AssetT;

    public abstract get type(): MediaType;

    public get asset() { return this._asset; };
    public get url() { return this._url; }
    public get skipAfter() { return this._skipAfter; }

    public constructor(private _url: string, private _skipAfter: number = null) {

    }

    public abstract preloadAssets(assetContainer: MRE.AssetContainer): Promise<void>;
}

export class ImageMedia extends StreamingMedia<MRE.Texture> /*implements ImageMediaLike*/ {
    public get type() { return MediaType.Image; }

    public constructor(config: Partial<ImageConfig>) {
        super(config?.imageUrl, config?.skipAfter);
    }

    public preloadAssets(assetContainer: MRE.AssetContainer): Promise<void> {
        this._asset = assetContainer.createTexture('image', {
            uri: this.url,
            wrapU: MRE.TextureWrapMode.Clamp,
            wrapV: MRE.TextureWrapMode.Clamp
        });

        // Return a wrapper promise that will create the image host actor and cache it?
        return this._asset.created;
    }
}

export class VideoMedia extends StreamingMedia<MRE.VideoStream> /*implements VideoMediaLike*/ {
    private _volume = .5;
    private _startTime = 0;
    private _loop = false;

    public get type() { return MediaType.Video; }

    public get volume() { return this._volume; }
    public get startTime() { return this._startTime; }
    public get loop() { return this._loop; }

    public constructor(config: Partial<VideoConfig>) {
        super(config?.videoUrl, config?.skipAfter);
        this.init(config);
    }

    public preloadAssets(assetContainer: MRE.AssetContainer): Promise<void> {
        this._asset = assetContainer.createVideoStream("video-stream", {
            uri: this.url
        });

        return this._asset.created;
    }

    private init(config: Partial<VideoConfig>): this {
        if (!config) { return this; }
        if (config.volume) { this._volume = config.volume; }
        if (config.startTime) { this._startTime = config.startTime; }
        if (config.loop) { this._loop = config.loop; }
    }
}
