/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import { ImageConfig, VideoConfig } from "./mediaConfig";

export enum MediaType {
    Video = 'video',
    Image = 'image'
}

export abstract class StreamingMedia /*implements StreamingMediaLike*/ {
    public abstract get type(): MediaType;
    
    public get url() { return this._url; }
    public get skipAfter() { return this._skipAfter; }

    public constructor(private _url: string, private _skipAfter: number = null) {

    }
}

export class ImageMedia extends StreamingMedia /*implements ImageMediaLike*/ {
    public get type() { return MediaType.Image; }

    public constructor(config: Partial<ImageConfig>) {
        super(config?.imageUrl, config?.skipAfter);
    }
}

export class VideoMedia extends StreamingMedia /*implements VideoMediaLike*/ {
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

    private init(config: Partial<VideoConfig>): this {
        if (!config) { return this; }
        if (config.volume) { this._volume = config.volume; }
        if (config.startTime) { this._startTime = config.startTime; }
        if (config.loop) { this._loop = config.loop; }
    }
}
