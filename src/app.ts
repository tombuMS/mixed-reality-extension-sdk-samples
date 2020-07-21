/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as MRE from '@microsoft/mixed-reality-extension-sdk';
import { TextureWrapMode } from '@microsoft/mixed-reality-extension-sdk';

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

enum PlaybackState {
	Stopped = 'stopped',
	Playing = 'playing',
	Paused = 'paused'
}

/**
 * The main class of this app. All the logic goes here.
 */
export default class YouTubePlayer {
	private videoUrl: string;
	private videoStream: MRE.VideoStream = null;
	private videoPlayer: MRE.Actor = null;
	private videoPlayerInstance: MRE.MediaInstance = null;

	private buttonMesh: MRE.Mesh = null;

	private buttonPanel: MRE.Actor = null;

	private playbackState = PlaybackState.Stopped;

	private assets: MRE.AssetContainer;

	constructor(private context: MRE.Context, private params: MRE.ParameterSet, private baseUrl: string) {
		this.context.onStarted(() => this.started());
		//this.videoUrl = "https://www.youtube.com/watch?v=SIH2eLsb44k";
		this.videoUrl = this.params.videoUrl as string;
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

		this.createButtonPanel();
	}

	private createButtonPanel() {
		this.buttonMesh = this.assets.createPlaneMesh('button-plane', 0.1, 0.05);
		// this.buttonMesh = this.assets.createBoxMesh('button-mesh', 0.1, 0.1, 0.005);

		this.buttonPanel = MRE.Actor.Create(this.context, { 
			actor: { 
				name: 'Button Panel',
				parentId: this.videoPlayer.id,
				transform: {
					local: {
						position: { x: 0, y: -0.31, z: -0.00002 }
					}
				}
			} 
		});
		const grid = new MRE.PlanarGridLayout(this.buttonPanel, MRE.BoxAlignment.MiddleCenter);
		const spacing = 0.11;

		
		grid.addCell({
			row: 0,
			column: 0,
			width: spacing,
			height: spacing,
			contents: this.createPlayButton()
		});

		grid.addCell({
			row: 0,
			column: 1,
			width: spacing,
			height: spacing,
			contents: this.createPauseButton()
		});

		grid.addCell({
			row: 0,
			column: 2,
			width: spacing,
			height: spacing,
			contents: this.createStopButton()
		});

		grid.applyLayout();

		// Load a glTF model
		// this.pauseButton = MRE.Actor.CreateFromGltf(this.assets, {
		// 	// at the given URL
		// 	uri: `${this.baseUrl}/button-with-material.glb`,
		// 	// and spawn box colliders around the meshes.
		// 	colliderType: 'box',
		// 	// Also apply the following generic actor properties.
		// 	actor: {
		// 		name: 'Pause Button',
		// 		// Parent the glTF model to the text actor.
		// 		parentId: this.videoPlayer.id,
		// 		transform: {
		// 			local: {
		// 				position: { x: 0, y: 0, z: 0 }
		// 			}
		// 		}
		// 	}
		// });

		//this.playTexture = this.assets.createTexture('playButtonTex', {
		//	uri: `${this.baseUrl}/media-play.png`,
		//	wrapU: TextureWrapMode.Clamp,
		//	wrapV: TextureWrapMode.Clamp
		//});
	}

	private createPauseButton(): MRE.Actor {
		const pauseText = MRE.Actor.Create(this.context, {
			actor: {
				name: 'Pause Text',
				parentId: this.buttonPanel.id,
				text: {
					contents: "Pause",
					anchor: MRE.TextAnchorLocation.MiddleCenter,
					color: { r: 30 / 255, g: 206 / 255, b: 213 / 255 },
					height: 0.02
				},
			}
		});

		const pauseButton = MRE.Actor.Create(this.context, {
			actor: { 
				name: 'Pause Button',
				parentId: pauseText.id,
				appearance: {
					meshId: this.buttonMesh.id,
					materialId: this.assets.createMaterial('pause-button-mat', {
						//mainTextureId: this.assets.createTexture('pause-button-tex', {
						//	uri: `${this.baseUrl}/media-pause.png`
						//}).id,
						color: MRE.Color3.Black()
					}).id
				},
				collider: { geometry: { shape: MRE.ColliderType.Auto } },
				transform: {
					local: {
						position: { x: 0, y: -0, z: 0.00001 },
						rotation: MRE.Quaternion.RotationAxis(MRE.Vector3.Right(), -90 * MRE.DegreesToRadians)
					}
				}
			}
		});

		pauseButton.setBehavior(MRE.ButtonBehavior).onClick(_ => {
			switch (this.playbackState) {
				case PlaybackState.Stopped:
					return;
				case PlaybackState.Playing:
					this.pauseVideo();
					break;
				case PlaybackState.Paused:
					this.resumeVideo();
					break;
			}
		})

		return pauseText;
	}

	private createPlayButton(): MRE.Actor {
		const playText = MRE.Actor.Create(this.context, {
			actor: {
				name: 'Play Text',
				parentId: this.buttonPanel.id,
				text: {
					contents: "Play",
					anchor: MRE.TextAnchorLocation.MiddleCenter,
					color: { r: 30 / 255, g: 206 / 255, b: 213 / 255 },
					height: 0.02
				},
			}
		});

		const playButton = MRE.Actor.Create(this.context, {
			actor: { 
				name: 'Play Button',
				parentId: playText.id,
				appearance: {
					meshId: this.buttonMesh.id,
					materialId: this.assets.createMaterial('play-button-mat', {
						// mainTextureId: this.assets.createTexture('play-button-tex', {
						// 	uri: `${this.baseUrl}/media-play.png`
						// }).id,
						color: MRE.Color3.Black()
					}).id
				},
				collider: { geometry: { shape: MRE.ColliderType.Auto } },
				transform: {
					local: {
						position: { x: 0, y: 0, z: 0.00001 },
						rotation: MRE.Quaternion.RotationAxis(MRE.Vector3.Right(), -90 * MRE.DegreesToRadians)
					}
				}
			}
		});

		playButton.setBehavior(MRE.ButtonBehavior).onClick(_ => {
			switch (this.playbackState) {
				case PlaybackState.Stopped:
					this.startVideo();
					break;
				case PlaybackState.Playing:
					return;
				case PlaybackState.Paused:
					this.resumeVideo()
					break;
			}
		})

		return playText;
	}

	private createStopButton(): MRE.Actor {
		const stopText = MRE.Actor.Create(this.context, {
			actor: {
				name: 'Stop Text',
				parentId: this.buttonPanel.id,
				text: {
					contents: "Stop",
					anchor: MRE.TextAnchorLocation.MiddleCenter,
					color: { r: 30 / 255, g: 206 / 255, b: 213 / 255 },
					height: 0.02
				},
			}
		});

		const stopButton = MRE.Actor.Create(this.context, {
			actor: { 
				name: 'Stop Button',
				parentId: stopText.id,
				appearance: {
					meshId: this.buttonMesh.id,
					materialId: this.assets.createMaterial('stop-button-mat', {
						// mainTextureId: this.assets.createTexture('play-button-tex', {
						// 	uri: `${this.baseUrl}/media-play.png`
						// }).id,
						color: MRE.Color3.Black()
					}).id
				},
				collider: { geometry: { shape: MRE.ColliderType.Auto } },
				transform: {
					local: {
						position: { x: 0, y: 0, z: 0.00001 },
						rotation: MRE.Quaternion.RotationAxis(MRE.Vector3.Right(), -90 * MRE.DegreesToRadians)
					}
				}
			}
		});

		stopButton.setBehavior(MRE.ButtonBehavior).onClick(_ => {
			if (this.playbackState === PlaybackState.Stopped) {
				return;
			}

			this.stopVideo();
		})

		return stopText;
	}

	private startVideo() {
		console.log('Starting the video player.');
		this.videoPlayerInstance.start({
			volume: .5,
			rolloffStartDistance: 1.0,
			looping: false,
			visible: true
		});

		this.playbackState = PlaybackState.Playing;
	}

	private pauseVideo() {
		console.log('Pausing video player');
		this.videoPlayerInstance.pause();
		this.playbackState = PlaybackState.Paused;
	}

	private resumeVideo() {
		console.log('Resuming paused video player');
		this.videoPlayerInstance.resume();
		this.playbackState = PlaybackState.Playing;
	}

	private stopVideo() {
		console.log("Stopping video player");
		this.videoPlayerInstance.stop();
		this.playbackState = PlaybackState.Stopped;
	}
}
