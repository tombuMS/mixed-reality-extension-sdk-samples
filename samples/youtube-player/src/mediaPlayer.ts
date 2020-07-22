/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as MRE from '@microsoft/mixed-reality-extension-sdk';
import { MediaType, ImageMediaLike, VideoMediaLike, StreamingMediaLike } from './media';

export enum PlaybackState {
	Stopped = 'stopped',
	Playing = 'playing',
	Paused = 'paused'
}

export class MediaPlayer {
    private _videoPlayerInstance: MRE.MediaInstance = null;
    private _videoStreamCache: { [url: string]: MRE.VideoStream } = {};
    // private imageCache: { [name: string]: Image} = {};

    private _currentMedia: StreamingMediaLike = null;
    private _playbackState = PlaybackState.Stopped;
    
    private imageHost: any;

    public get currentMediaType() { return this._currentMedia?.type; }
    public get playbackState() { return this._playbackState; }

    constructor(private rootActor: MRE.Actor, private assets: MRE.AssetContainer) {

    }

    // public start(mediaType: MediaType.Image, media: ImageMediaLike): void;
    // public start(mediaType: MediaType.Video, media: VideoMediaLike): void;
    public start(media: ImageMediaLike | VideoMediaLike): void {
        // Clear out the video and image hosts.
        this._videoPlayerInstance = null;

        if (media.type === MediaType.Video) {
            this.startVideo(media as VideoMediaLike);
        }

        this._playbackState = PlaybackState.Playing;
    }

    public stop() {
        if (this._videoPlayerInstance) {
            this._videoPlayerInstance.stop();
        }

        this._playbackState = PlaybackState.Stopped;
    }

    public pause() {
        if (this._videoPlayerInstance) {
            this._videoPlayerInstance.pause();
        }

        this._playbackState = PlaybackState.Paused;
    }

    public resume() {
        if (this._videoPlayerInstance) {
            this._videoPlayerInstance.resume();
        }

        this._playbackState = PlaybackState.Playing;
    }

    //=======================================================================================================================
    // Helper Functions
    private startVideo(video: VideoMediaLike) {
        this._videoStreamCache[video.url] = this._videoStreamCache[video.url] 
            ?? this.assets.createVideoStream(`${video.url}`, {
                uri: video.url
            });

        this._videoPlayerInstance = new MRE.MediaInstance(this.rootActor, this._videoStreamCache[video.url].id);
        this._videoPlayerInstance.start({
            volume: video.volume,
            time: video.startTime,
            looping: video.loop
        });
    }
}