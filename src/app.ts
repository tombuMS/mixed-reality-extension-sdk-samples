/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as MRE from '@microsoft/mixed-reality-extension-sdk';
import { VideoMedia, StreamingMedia } from './media';
import { MediaPlayer, PlaybackState } from './mediaPlayer';

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
	private assets: MRE.AssetContainer;
	private buttonMesh: MRE.Mesh = null;
	private buttonPanel: MRE.Actor = null;

	private mediaPlayerRoot: MRE.Actor = null;
	private mediaPlayer: MediaPlayer = null;

	//private videoUrl: string;

	private media: StreamingMedia[] = [];
	private currentMediaIdx: number = null;

	constructor(private context: MRE.Context, private params: MRE.ParameterSet, private baseUrl: string) {
		this.context.onStarted(() => this.started());
		//this.videoUrl = "https://www.youtube.com/watch?v=SIH2eLsb44k";
		//this.videoUrl = this.params.videoUrl as string;
		this.media.push(new VideoMedia({ url: this.params.videoUrl as string }));
		this.currentMediaIdx = 0;
	}

	/**
	 * Once the context is "started", initialize the app.
	 */
	private started() {
		// Load assets
		this.loadAssets();

		// Create the media instance
		this.mediaPlayerRoot = MRE.Actor.CreateEmpty(this.context, {});
		this.mediaPlayer = new MediaPlayer(this.mediaPlayerRoot, this.assets);

		this.createButtonPanel();
	}

	private loadAssets() {
		this.assets = new MRE.AssetContainer(this.context);
		this.buttonMesh = this.assets.createPlaneMesh('button-plane', 0.1, 0.05);
		// this.buttonMesh = this.assets.createBoxMesh('button-mesh', 0.1, 0.1, 0.005);
	}

	private createButtonPanel() {
		this.buttonPanel = MRE.Actor.Create(this.context, { 
			actor: { 
				name: 'Button Panel',
				parentId: this.mediaPlayerRoot.id,
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
			contents: this.createButton('Play', _ => {
				switch (this.mediaPlayer.playbackState) {
					case PlaybackState.Stopped:
						const currentMedia = this.media[this.currentMediaIdx];
						if (currentMedia) {
							this.mediaPlayer.start(currentMedia);
						}
						break;
					case PlaybackState.Playing:
						return;
					case PlaybackState.Paused:
						this.mediaPlayer.resume();
						break;
				}
			})
		});

		grid.addCell({
			row: 0,
			column: 1,
			width: spacing,
			height: spacing,
			contents: this.createButton('Pause', _ => {
				switch (this.mediaPlayer.playbackState) {
					case PlaybackState.Stopped:
						return;
					case PlaybackState.Playing:
						this.mediaPlayer.pause();
						break;
					case PlaybackState.Paused:
						this.mediaPlayer.resume();
						break;
				}
			})
		});

		grid.addCell({
			row: 0,
			column: 2,
			width: spacing,
			height: spacing,
			contents: this.createButton('Stop', _ => {
				if (this.mediaPlayer.playbackState === PlaybackState.Stopped) {
					return;
				}
	
				this.mediaPlayer.stop();
			})
		});

		grid.applyLayout();

		// Load a glTF model
		const pauseButton = MRE.Actor.CreateFromGltf(this.assets, {
			// at the given URL
			uri: `${this.baseUrl}/button-with-material.glb`,
			// and spawn box colliders around the meshes.
			colliderType: 'box',
			// Also apply the following generic actor properties.
			actor: {
				name: 'Pause Button',
				// Parent the glTF model to the text actor.
				parentId: this.mediaPlayerRoot.id,
				transform: {
					local: {
						position: { x: 0, y: 0, z: 0 },
						scale: { x: 0, y: 0, z: 0 }
					}
				} 
			}
		});

		//this.playTexture = this.assets.createTexture('playButtonTex', {
		//	uri: `${this.baseUrl}/media-play.png`,
		//	wrapU: TextureWrapMode.Clamp,
		//	wrapV: TextureWrapMode.Clamp
		//});
	}

	private createButton(buttonLabel: string, clickHandler: (user: MRE.User) => void): MRE.Actor {
		const buttonContainer = MRE.Actor.Create(this.context, {
			actor: {
				name: `${buttonLabel} Text`,
				parentId: this.buttonPanel.id,
				text: {
					contents: buttonLabel,
					anchor: MRE.TextAnchorLocation.MiddleCenter,
					color: { r: 30 / 255, g: 206 / 255, b: 213 / 255 },
					height: 0.02
				},
			}
		});

		const button = MRE.Actor.Create(this.context, {
			actor: { 
				name: `${buttonLabel} Button`,
				parentId: buttonContainer.id,
				appearance: {
					meshId: this.buttonMesh.id,
					materialId: this.assets.createMaterial(`${buttonLabel.toLowerCase()}-button-mat`, {
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

		button.setBehavior(MRE.ButtonBehavior).onClick(clickHandler);

		return buttonContainer;
	}


	//=============================================================================================================================
	// Video functions
	// private startVideo() {
	// 	console.log('Starting the video player.');
	// 	this.videoPlayerInstance.start({
	// 		volume: .5,
	// 		rolloffStartDistance: 1.0,
	// 		looping: false,
	// 		visible: true
	// 	});
// 
	// 	this.playbackState = PlaybackState.Playing;
	// }
// 
	// private pauseVideo() {
	// 	console.log('Pausing video player');
	// 	this.videoPlayerInstance.pause();
	// 	this.playbackState = PlaybackState.Paused;
	// }
// 
	// private resumeVideo() {
	// 	console.log('Resuming paused video player');
	// 	this.videoPlayerInstance.resume();
	// 	this.playbackState = PlaybackState.Playing;
	// }
// 
	// private stopVideo() {
	// 	console.log("Stopping video player");
	// 	this.videoPlayerInstance.stop();
	// 	this.playbackState = PlaybackState.Stopped;
	// }
}
