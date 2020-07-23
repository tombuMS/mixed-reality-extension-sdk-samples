/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as MRE from '@microsoft/mixed-reality-extension-sdk';
import { VideoMedia, StreamingMedia } from './media';
import { MediaPlayer, PlaybackState } from './mediaPlayer';
import UserManager from './userManager';
import MediaSetupOverlay from './mediaSetupOverlay';
import MediaManager from './mediaManager';

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
export default class YouTubePlayerApp {
	private _assets: MRE.AssetContainer;
	private _buttonMesh: MRE.Mesh = null;
	private _buttonMaterial: MRE.Material = null;

	private _buttonPanel: MRE.Actor = null;

	private _mediaPlayerRoot: MRE.Actor = null;
	private _mediaPlayer: MediaPlayer = null;

	private _userManager: UserManager = null;
	private _mediaManager: MediaManager = null;
	private _mediaSetupOverlay: MediaSetupOverlay = null;

	public get assets() { return this._assets; }
	public get context() { return this._context; }
	public get baseUrl() { return this._baseUrl; }
	public get userManager() { return this._userManager; }
	public get mediaManager() { return this._mediaManager; }

	constructor(private _context: MRE.Context, private _params: MRE.ParameterSet, private _baseUrl: string) {
		this._userManager = new UserManager(this);
		this._mediaManager = new MediaManager(this);

		this.context.onStarted(() => this.started());
		this.context.onUserJoined(user => this._userManager.onUserJoined(user));

		if (_params.loopMediaSet && (_params.loopMediaSet as string).toLowerCase() === 'true') {
			this._mediaManager.loopMediaList = true;
		}

		this._mediaSetupOverlay = new MediaSetupOverlay(this);
	}

	public startMediaPlayer() {
		this.showMediaPlayer();
	}

	/**
	 * Once the context is "started", initialize the app.
	 */
	private started() {
		// Load assets
		this.loadAssets();

		this._mediaSetupOverlay.showOwnerOverlay();
		// this.startMediaPlayer();
	}

	private loadAssets() {
		this._assets = new MRE.AssetContainer(this.context);
		this._buttonMesh = this.assets.createPlaneMesh('button-plane', 0.1, 0.05);
		this._buttonMaterial = this.assets.createMaterial('button-mat', {
			mainTextureId: this.assets.createTexture('button-tex', {
				uri: `${this.baseUrl}/greyBtn.png`
			}).id,
			alphaMode: MRE.AlphaMode.Mask
		})
	}

	private showMediaPlayer() {
		// Create the media instance
		const appScalar = 5;
		this._mediaPlayerRoot = MRE.Actor.CreateEmpty(this.context, {
			actor: {
				name: 'Media Player Root',
				transform: {
					local: {
						scale: { x: 1 * appScalar, y: 1 * appScalar, z: 1 * appScalar }
					}
				}
			}
		});
		this._mediaPlayer = new MediaPlayer(this._mediaPlayerRoot, this.assets);

		this.createButtonPanel();
	}

	private createButtonPanel() {
		this._buttonPanel = MRE.Actor.Create(this.context, { 
			actor: { 
				name: 'Button Panel',
				parentId: this._mediaPlayerRoot.id,
				transform: {
					local: {
						position: { x: 0, y: -0.31, z: -0.00002 }
					}
				}
			} 
		});

		const grid = new MRE.PlanarGridLayout(this._buttonPanel, MRE.BoxAlignment.MiddleCenter);
		const spacing = 0.11;

		grid.addCell({
			row: 0,
			column: 0,
			width: spacing,
			height: spacing,
			contents: this.createButton('Prev', _ => {
				const next = this._mediaManager.perviousMedia();
				if (next) {
					// We only do something with the previous button in the case that we have previous media
					// to play, or if the media list has looped around in the media manager.
					this._mediaPlayer.stop();
					this._mediaPlayer.start(next);
				}
			})
		});

		grid.addCell({
			row: 0,
			column: 1,
			width: spacing,
			height: spacing,
			contents: this.createButton('Play', _ => {
				switch (this._mediaPlayer.playbackState) {
					case PlaybackState.Stopped:
						const current = this._mediaManager.currentMedia();
						if (current) {
							this._mediaPlayer.start(current);
						}
						break;
					case PlaybackState.Playing:
						return;
					case PlaybackState.Paused:
						this._mediaPlayer.resume();
						break;
				}
			})
		});

		grid.addCell({
			row: 0,
			column: 2,
			width: spacing,
			height: spacing,
			contents: this.createButton('Pause', _ => {
				switch (this._mediaPlayer.playbackState) {
					case PlaybackState.Stopped:
						return;
					case PlaybackState.Playing:
						this._mediaPlayer.pause();
						break;
					case PlaybackState.Paused:
						this._mediaPlayer.resume();
						break;
				}
			})
		});

		grid.addCell({
			row: 0,
			column: 3,
			width: spacing,
			height: spacing,
			contents: this.createButton('Stop', _ => {
				if (this._mediaPlayer.playbackState === PlaybackState.Stopped) {
					return;
				}
	
				this._mediaPlayer.stop();
			})
		});

		grid.addCell({
			row: 0,
			column: 4,
			width: spacing,
			height: spacing,
			contents: this.createButton('Next', _ => {
				this._mediaPlayer.stop();

				const next = this._mediaManager.nextMedia();
				if (next) {
					this._mediaPlayer.start(next);
				}
			})
		});

		grid.applyLayout();
		this._buttonPanel.created().then(() => {
			this._buttonPanel.appearance.enabled = new MRE.GroupMask(this._context, [UserManager.OWNER_MASK]);
		})


		// Load a glTF model
		//const pauseButton = MRE.Actor.CreateFromGltf(this.assets, {
		//	// at the given URL
		//	uri: `${this.baseUrl}/button-with-material.glb`,
		//	// and spawn box colliders around the meshes.
		//	colliderType: 'box',
		//	// Also apply the following generic actor properties.
		//	actor: {
		//		name: 'Pause Button',
		//		// Parent the glTF model to the text actor.
		//		parentId: this._mediaPlayerRoot.id,
		//		transform: {
		//			local: {
		//				position: { x: 0, y: 0, z: 0 },
		//				scale: { x: 0, y: 0, z: 0 }
		//			}
		//		} 
		//	}
		//});

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
				parentId: this._buttonPanel.id,
				text: {
					contents: buttonLabel,
					anchor: MRE.TextAnchorLocation.MiddleCenter,
					color: MRE.Color3.White(),
					height: 0.02
				},
			}
		});

		const button = MRE.Actor.Create(this.context, {
			actor: { 
				name: `${buttonLabel} Button`,
				parentId: buttonContainer.id,
				appearance: {
					meshId: this._buttonMesh.id,
					materialId: this._buttonMaterial.id
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
