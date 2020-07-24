/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as MRE from '@microsoft/mixed-reality-extension-sdk';
import { MediaType, ImageMedia, VideoMedia, StreamingMedia, StreamingMediaLike } from './media';
import MediaManager from './mediaManager';
import Constants from './constants';

export enum PlaybackState {
	Stopped = 'stopped',
	Playing = 'playing',
	Paused = 'paused'
}

export class MediaPlayer {
    private _videoPlayerInstance: MRE.MediaInstance = null;
    // private _videoStreamCache: { [url: string]: MRE.VideoStream } = {};
    // private imageCache: { [name: string]: Image} = {};

    private _currentMedia: StreamingMediaLike = null;
    private _playbackState = PlaybackState.Stopped;

    private _skipTimeout: NodeJS.Timeout = null;
    
    // Will be used to host the image
    private _imageHost: MRE.Actor;
    private _imageHostMat: MRE.Material;

    public get currentMediaType() { return this._currentMedia?.type; }
    public get playbackState() { return this._playbackState; }

    constructor(private rootActor: MRE.Actor, private assets: MRE.AssetContainer, private _mediaManager: MediaManager) {
        this._imageHostMat = assets.createMaterial("media-player-bg-mat", {
            //color: MRE.Color3.Gray()
        });

        if (Constants.DEBUG) {
            MRE.Actor.CreatePrimitive(assets, {
                definition: {
                    shape: MRE.PrimitiveShape.Plane,
                    dimensions: { x: 1, y: 0, z: 9 / 16 }
                },
                actor: {
                    name: "media-player-debug-bg",
                    parentId: rootActor.id,
                    appearance: {
                        materialId: assets.createMaterial("debug-bg-mat", {
                            color: MRE.Color3.Gray()
                        }).id
                    },
                    transform: {
                        local: {
                            position: { x: 0, y: 0, z: 0.001 },
                            rotation: MRE.Quaternion.RotationAxis(MRE.Vector3.Right(), -90 * MRE.DegreesToRadians)
                        }
                    }
                }
            });
        }
    }

    public start(): void {
        this._currentMedia = this._currentMedia ?? this._mediaManager.currentMedia();
        if (!this._currentMedia) {
            return;
        }

        // Clear out any skip timer that might exist.
        this.clearSkipTimeout();

        if (this._currentMedia.type === MediaType.Video) {
            this.startVideo(this._currentMedia as VideoMedia);
        } else if (this._currentMedia.type === MediaType.Image) {
            this.startImage(this._currentMedia as ImageMedia);
        }

        if (this._currentMedia.skipAfter > 0) {
            this._skipTimeout = setTimeout(_ => { this.next() }, this._currentMedia.skipAfter * 1000);
        }

        this._playbackState = PlaybackState.Playing;
    }

    public stop() {
        if (this._videoPlayerInstance) {
            this._videoPlayerInstance.stop();
            delete this._videoPlayerInstance;
        }

        if (this._imageHost) {
            this._imageHost.destroy();
            delete this._imageHost;
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
        //this._videoStreamCache[video.url] = this._videoStreamCache[video.url] 
        //    ?? this.assets.createVideoStream(`${video.url}`, {
        //        uri: video.url
        //    });

        this._videoPlayerInstance = new MRE.MediaInstance(this.rootActor, video.asset.id);
        this._videoPlayerInstance.start({
            volume: video.volume,
            time: video.startTime,
            looping: video.loop
        });
    }

    private startImage(image: ImageMedia) {
        const texture = image.asset;
        const imgResolution = texture.resolution;

        // Calculate the bounds we need to clamp in one direction or the other to 1 x 1 max size.
        const fixedAspectRation = 16 / 9;
        const imgAspectRation = imgResolution.x / imgResolution.y;

        // Initialize as normalized height of 16:9 window.
        let width = 1; 
        let height = 9 / 16; // Needs to be based on a height of a 16:9 video

        
        if (imgAspectRation < fixedAspectRation) {
            // Narrower than 16:9
            width = imgResolution.x / (imgResolution.y * fixedAspectRation);
        } else if (imgAspectRation > fixedAspectRation) {
            // Wider than 16:9
            height = imgResolution.y / imgResolution.x
        } // else we are the same ratio so leave initial 16:9 normalized height and width

        // Update the image host material with the image texture.
        this._imageHostMat.color = null;
        this._imageHostMat.mainTextureId = texture.id;

        // Create new image host with the correct bounds for the texture.
        this._imageHost = MRE.Actor.CreatePrimitive(this.assets, {
            definition: {
                shape: MRE.PrimitiveShape.Plane,
                dimensions: { x: width, y: 0, z: height }
            },
            actor: {
                name: "img-host",
                parentId: this.rootActor.id,
                appearance: {
                    materialId: this._imageHostMat.id,
                },
                transform: {
                    local: {
                        rotation: MRE.Quaternion.RotationAxis(MRE.Vector3.Right(), -90 * MRE.DegreesToRadians)
                    }
                }
            }
        });
    }
}