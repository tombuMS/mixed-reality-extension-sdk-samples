/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

export enum MediaType {
    Video = 'video',
    Image = 'image'
}

export interface StreamingMediaLike {
    type: MediaType;
    url: string;
    skipAfter: number;
}

export interface ImageMediaLike extends StreamingMediaLike {

}

export interface VideoMediaLike extends StreamingMediaLike {
    volume: number;
	startTime: number;
	loop: boolean;
}

export abstract class StreamingMedia implements StreamingMediaLike {
    protected _url = "";
    protected _skipAfter = 0;

    public abstract get type(): MediaType;
    
    public get url() { return this._url; }
    public get skipAfter() { return this._skipAfter; }

    public constructor(url: string) {
        this._url = url;
    }
}

export class ImageMedia extends StreamingMedia implements ImageMediaLike {
    public get type() { return MediaType.Image; }

    public constructor(init: Partial<ImageMediaLike>) {
        super(init?.url);
        this.init(init);
    }

    private init(from: Partial<ImageMediaLike>) {
        if (!from) { return this; }
        if (from.skipAfter) { this._skipAfter = from.skipAfter; }
    }
}

export class VideoMedia extends StreamingMedia implements VideoMediaLike {
    private _volume = .5;
    private _startTime = 0;
    private _loop = false;

    public get type() { return MediaType.Video; }

    public get volume() { return this._volume; }
    public get startTime() { return this._startTime; }
    public get loop() { return this._loop; }

    public constructor(init: Partial<VideoMediaLike>) {
        super(init?.url);
        this.init(init);
    }

    private init(from: Partial<VideoMediaLike>): this {
        if (!from) { return this; }
        if (from.url) { this._url = from.url; }
        if (from.skipAfter) { this._skipAfter = from.skipAfter; }
        if (from.volume) { this._volume = from.volume; }
        if (from.startTime) { this._startTime = from.startTime; }
        if (from.loop) { this._loop = from.loop; }
    }
}
