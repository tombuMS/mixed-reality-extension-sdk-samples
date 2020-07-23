/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as MRE from '@microsoft/mixed-reality-extension-sdk';
import { MediaType, ImageMedia, VideoMedia, StreamingMedia } from './media';
import MediaManager from './mediaManager';

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

    private _skipTimeout: NodeJS.Timeout = null;
    
    // Will be used to host the image
    private imageHost: MRE.Actor;

    public get currentMediaType() { return this._currentMedia?.type; }
    public get playbackState() { return this._playbackState; }

    constructor(private rootActor: MRE.Actor, private assets: MRE.AssetContainer, private _mediaManager: MediaManager) {

    }

    public start(): void {
        this._currentMedia = this._currentMedia ?? this._mediaManager.currentMedia();
        if (!this._currentMedia) {
            return;
        }

        // Clear out any skip timer that might exist.
        this.clearSkipTimeout();

        // Clear out the video and image hosts.
        delete this._videoPlayerInstance;

        if (this._currentMedia.type === MediaType.Video) {
            this.startVideo(this._currentMedia as VideoMedia);
        }

        if (this._currentMedia.skipAfter > 0) {
            this._skipTimeout = setTimeout(_ => { this.next() }, this._currentMedia.skipAfter * 1000);
        }

        this._playbackState = PlaybackState.Playing;
    }

    public stop() {
        if (this._videoPlayerInstance) {
            this._videoPlayerInstance.stop();
        }

        this.clearSkipTimeout();

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

    public next() {
        this.stop()
        this._currentMedia = this._mediaManager.nextMedia();
        this.start();
    }

    public previous() {
        this.stop();
        this._currentMedia = this._mediaManager.perviousMedia();
        this.start();
    }

    //=======================================================================================================================
    // Helper Functions
    private clearSkipTimeout() {
        if (this._skipTimeout) {
            clearTimeout(this._skipTimeout);
            delete this._skipTimeout;
            this._skipTimeout = null;
        }
    }

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

    private startImage(image: ImageMedia) {
        
    }
}