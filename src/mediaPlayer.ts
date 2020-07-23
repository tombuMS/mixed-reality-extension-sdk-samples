/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as MRE from '@microsoft/mixed-reality-extension-sdk';
import { MediaType, ImageMedia, VideoMedia, StreamingMedia } from './media';

export enum PlaybackState {
	Stopped = 'stopped',
	Playing = 'playing',
	Paused = 'paused'
}

export class MediaPlayer {
    private _videoPlayerInstance: MRE.MediaInstance = null;
    private _videoStreamCache: { [url: string]: MRE.VideoStream } = {};
    // private imageCache: { [name: string]: Image} = {};

    private _currentMedia: StreamingMedia = null;
    private _playbackState = PlaybackState.Stopped;
    
    private imageHost: any;

    public get currentMediaType() { return this._currentMedia?.type; }
    public get playbackState() { return this._playbackState; }

    constructor(private rootActor: MRE.Actor, private assets: MRE.AssetContainer) {

    }

    // public start(mediaType: MediaType.Image, media: ImageMediaLike): void;
    // public start(mediaType: MediaType.Video, media: VideoMediaLike): void;
    public start(media: ImageMedia | VideoMedia): void {
        // Clear out the video and image hosts.
        delete this._videoPlayerInstance;

        if (media.type === MediaType.Video) {
            this.startVideo(media as VideoMedia);
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
    private startVideo(video: VideoMedia) {
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