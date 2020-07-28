/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as MRE from '@microsoft/mixed-reality-extension-sdk';
import { MediaPlayer, PlaybackState } from './mediaPlayer';
import UserManager from './userManager';
import MediaSetupOverlay from './mediaSetupOverlay';
import MediaManager from './mediaManager';

/**
 * The main class of the media player app.
 */
export default class MediaPlayerApp {
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
		this._assets = new MRE.AssetContainer(this.context);
		this._userManager = new UserManager(this);
		this._mediaManager = new MediaManager(this);

		this.context.onStarted(() => this.started());
		this.context.onUserJoined(user => this._userManager.onUserJoined(user));
		this.context.onUserLeft(user => this._userManager.onUserLeft(user));

		if (_params.loopMediaSet && (_params.loopMediaSet as string).toLowerCase() === 'true') {
			this._mediaManager.loopMediaList = true;
		}
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

		// Check to see if the media manager is loading a config already for this session.  If not, we need to 
		// show the setup dialog.
		if (!this.mediaManager.loadingInitConfig) {
			this._mediaSetupOverlay = this._mediaSetupOverlay ?? new MediaSetupOverlay(this);
			this._mediaSetupOverlay.showOwnerOverlay();
		} else {
			this.startMediaPlayer();
		}
	}

	private loadAssets() {
		this._buttonMesh = this.assets.createPlaneMesh('button-plane', 0.1, 0.05);
		this._buttonMaterial = this.assets.createMaterial('button-mat', {
			mainTextureId: this.assets.createTexture('button-tex', {
				uri: `${this.baseUrl}/greyBtn.png`
			}).id,
			alphaMode: MRE.AlphaMode.Mask
		})
	}

	// TODO @tombu: Refactor this in to the media player as it's own asset management and UI.
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

		this._mediaPlayer = this._mediaPlayer ?? new MediaPlayer(this._mediaPlayerRoot, this.assets, this._mediaManager);

		this.createButtonPanel();
	}

	// TODO @tombu: Refactor this in to the media player as it's own asset management and UI.
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
				this._mediaPlayer.previous();
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
						this._mediaPlayer.start();
						break;
					case PlaybackState.Playing:
						return;
					case PlaybackState.Paused:
						this._mediaPlayer.resume();
						break;
				}
			})
		});

		// TODO: Re-enable once pause is fixed and update the other button columns.
		// grid.addCell({
		// 	row: 0,
		// 	column: 2,
		// 	width: spacing,
		// 	height: spacing,
		// 	contents: this.createButton('Pause', _ => {
		// 		switch (this._mediaPlayer.playbackState) {
		// 			case PlaybackState.Stopped:
		// 				return;
		// 			case PlaybackState.Playing:
		// 				this._mediaPlayer.pause();
		// 				break;
		// 			case PlaybackState.Paused:
		// 				this._mediaPlayer.resume();
		// 				break;
		// 		}
		// 	})
		// });

		grid.addCell({
			row: 0,
			column: 2,
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
			column: 3,
			width: spacing,
			height: spacing,
			contents: this.createButton('Next', _ => {
				this._mediaPlayer.next();
			})
		});

		grid.applyLayout();
		this._buttonPanel.created().then(() => {
			this._buttonPanel.appearance.enabled = new MRE.GroupMask(this._context, [UserManager.OWNER_MASK]);
		});
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
}
