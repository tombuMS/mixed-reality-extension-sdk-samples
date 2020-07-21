/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as MRE from '@microsoft/mixed-reality-extension-sdk';

// export declare type SetVideoStateOptions = {
//     /**
//      * volume multiplier, (0.0-1.0, where 0.0=no sound, 1.0=maximum)
//      */
//     volume?: number;
//     /**
//      * repeat the video when ended, or turn it off after playing once
//      */
//     looping?: boolean;
//     /**
//      * pause or unpause the video. Default to false.
//      */
//     paused?: boolean;
//     /**
//      * Specify how much a sound is non-directional (playing the same volume in each speaker
//      * regardless of facing direction)
//      * vs directional (playing only in the speakers that are pointing towards the sound source).
//      * This can be used to make sounds seem more "wide".
//      * It is also useful for multi-channel sounds (such as music), because a fully directional sound
//      * will always sound like mono.
//      * Default to 0.0. For music and ambient looping sounds, set this between 0.5 and 1.0.
//      */
//     spread?: number;
//     /**
//      * Sounds will play at full volume until user is this many meters away,
//      * and then volume will decrease logarithmically.
//      * Default to 1.0. For sound that needs to fill up a large space (like a concert), increase this number.
//      */
//     rolloffStartDistance?: number;
//     /**
//      * The media should start at, or seek this many seconds into the media.
//      * Time is in seconds relative to start of clip.
//      */
//     time?: number;
//     /**
//      * Should the video stream be visible or invisible
//      */
//     visible?: boolean;
// };

/**
 * The main class of this app. All the logic goes here.
 */
export default class YouTubePlayer {
	private videoUrl: string;
	private videoStream: MRE.VideoStream = null;
	private videoPlayer: MRE.Actor = null;
	private videoPlayerInstance: MRE.MediaInstance = null;
	private text: MRE.Actor = null;
	private cube: MRE.Actor = null;
	private assets: MRE.AssetContainer;

	constructor(private context: MRE.Context, private params: MRE.ParameterSet, private baseUrl: string) {
		this.context.onStarted(() => this.started());
		//this.videoUrl = "https://www.youtube.com/watch?v=SIH2eLsb44k";
		this.videoUrl = this.params.url as string;
		console.log(`Starting video player app with video url: ${this.videoUrl}`);
	}

	/**
	 * Once the context is "started", initialize the app.
	 */
	private started() {
		// Load assets
		this.assets = new MRE.AssetContainer(this.context);
		this.videoStream = this.assets.createVideoStream('video', {
			uri: this.videoUrl
		});

		// Create the media instance
		this.videoPlayer = MRE.Actor.CreateEmpty(this.context, {});
		this.videoPlayerInstance = new MRE.MediaInstance(this.videoPlayer, this.videoStream.id);

		console.log('Auto starting the video player.');
		// Auto play the video for now.
		this.videoPlayerInstance.start({
			volume: .5,
			rolloffStartDistance: 1.0,
			looping: false,
			visible: true
		});
	}

	/**
	 * Generate keyframe data for a simple spin animation.
	 * @param duration The length of time in seconds it takes to complete a full revolution.
	 * @param axis The axis of rotation in local space.
	 */
	private generateSpinKeyframes(duration: number, axis: MRE.Vector3): Array<MRE.Keyframe<MRE.Quaternion>> {
		return [{
			time: 0 * duration,
			value: MRE.Quaternion.RotationAxis(axis, 0)
		}, {
			time: 0.25 * duration,
			value: MRE.Quaternion.RotationAxis(axis, Math.PI / 2)
		}, {
			time: 0.5 * duration,
			value: MRE.Quaternion.RotationAxis(axis, Math.PI)
		}, {
			time: 0.75 * duration,
			value: MRE.Quaternion.RotationAxis(axis, 3 * Math.PI / 2)
		}, {
			time: 1 * duration,
			value: MRE.Quaternion.RotationAxis(axis, 2 * Math.PI)
		}];
	}
}
