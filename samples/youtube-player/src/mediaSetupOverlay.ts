import * as MRE from '@microsoft/mixed-reality-extension-sdk';
import App from "./app";
import { appendFile } from 'fs';
import UserManager from './userManager';
import { User } from '@microsoft/mixed-reality-extension-sdk';


export default class MediaSetupOverlay {
    public constructor(private _app: App) {

    }

    public showOwnerOverlay() {
        // Create overlay container
        const prompScalar = 3;
        const overlay = MRE.Actor.CreatePrimitive(this._app.assets, {
            definition: {
                shape: MRE.PrimitiveShape.Plane,
                dimensions: { x: 1 * prompScalar, y: 0.6 * prompScalar, z: 0.6 * prompScalar }
            },
            actor: {
                name: 'Owner Prompt',
                appearance: {
                    materialId: this._app.assets.createMaterial('promp-bg-mat', {
                        mainTextureId: this._app.assets.createTexture('prompt-bg-tex', {
                            uri: `${this._app.baseUrl}/ownerPrompt/promptOverlay.png`
                        }).id,
                        alphaMode: MRE.AlphaMode.Mask
                    }).id,
                },
                transform: {
                    local: {
                        position: { x: 0.5, y: 1, z: 0 },
                        rotation: MRE.Quaternion.RotationAxis(MRE.Vector3.Right(), -90 * MRE.DegreesToRadians)
                    }
                }
            }
        });
        const promptTitle = MRE.Actor.Create(this._app.context, {
            actor:  {
                name: 'Owner Prompt Title',
                parentId: overlay.id,
				text: {
					contents: 'Are you the media\n player owner?',
                    anchor: MRE.TextAnchorLocation.MiddleCenter,
                    justify: MRE.TextJustify.Center,
                    color: MRE.Color3.White(),
                    height: 0.2,
                },
                transform: {
                    local: {
                        position: { x: 0, y: 0.00001, z: 0.25 },
                        rotation: MRE.Quaternion.RotationAxis(MRE.Vector3.Right(), 90 * MRE.DegreesToRadians)
                    }
                }
            }
        });

        // Confirmation buttons
        const buttonScalar = 0.5;
        const buttonDimensions = new MRE.Vector3(1 * buttonScalar, 0.66 * buttonScalar, 0.66 * buttonScalar);

        // Yes button
        const yesBtn = MRE.Actor.CreatePrimitive(this._app.assets, {
            definition: {
                shape: MRE.PrimitiveShape.Plane,
                dimensions: buttonDimensions
            },
            addCollider: true,
            actor: {
                parentId: overlay.id,
                appearance: {
                    materialId: this._app.assets.createMaterial('prompt-yes-btn-mat', {
                        mainTextureId: this._app.assets.createTexture('prompt-yes-btn-mat', {
                            uri: `${this._app.baseUrl}/ownerPrompt/greenBtn.png`
                        }).id,
                        alphaMode: MRE.AlphaMode.Mask
                    }).id
                },
                transform: {
                    local: {
                        position: { x: -0.5, y: 0.05, z: -0.35 }
                    }
                }
            }
        });
        const yesBtnTitle = MRE.Actor.Create(this._app.context, {
            actor: {
                name: 'Yes Button Title',
                parentId: yesBtn.id,
                text: {
                    contents: "Yes",
                    anchor: MRE.TextAnchorLocation.MiddleCenter,
                    justify: MRE.TextJustify.Center,
                    color: MRE.Color3.White(),
                    height: 0.16,
                },
                transform: {
                    local: {
                        position: { x: 0, y: 0.01, z: 0 },
                        rotation: MRE.Quaternion.RotationAxis(MRE.Vector3.Right(), 90 * MRE.DegreesToRadians)
                    }
                }
            }
        });
        yesBtn.setBehavior(MRE.ButtonBehavior).onClick(user => {
            this._app.userManager.setMediaPlayerOwner(user.id);
            this._app.mediaManager.loadMediaConfig(user).then(loaded => {
                if (loaded) {
                    this._app.startMediaPlayer();
                } else {
                    this.showMediaJsonInputOverlay(user);
                }

                overlay.destroy();
            });
        });

        // No button
        const noBtn = MRE.Actor.CreatePrimitive(this._app.assets, {
            definition: {
                shape: MRE.PrimitiveShape.Plane,
                dimensions: buttonDimensions
            },
            addCollider: true,
            actor: {
                parentId: overlay.id,
                appearance: {
                    materialId: this._app.assets.createMaterial('prompt-no-btn-mat', {
                        mainTextureId: this._app.assets.createTexture('prompt-no-btn-mat', {
                            uri: `${this._app.baseUrl}/ownerPrompt/redBtn.png`
                        }).id,
                        alphaMode: MRE.AlphaMode.Mask
                    }).id
                },
                transform: {
                    local: {
                        position: { x: 0.5, y: 0.05, z: -0.35 }
                    }
                }
            }
        });
        const noBtnTitle = MRE.Actor.Create(this._app.context, {
            actor: {
                name: 'No Button Title',
                parentId: noBtn.id,
                text: {
                    contents: "No",
                    anchor: MRE.TextAnchorLocation.MiddleCenter,
                    justify: MRE.TextJustify.Center,
                    color: MRE.Color3.White(),
                    height: 0.16,
                },
                transform: {
                    local: {
                        position: { x: 0, y: 0.01, z: 0 },
                        rotation: MRE.Quaternion.RotationAxis(MRE.Vector3.Right(), 90 * MRE.DegreesToRadians)
                    }
                }
            }
        });
        noBtn.setBehavior(MRE.ButtonBehavior).onClick(user => {
            user.groups.delete(UserManager.MODERATOR_MASK);
        });

        // Set the visibility of the prompt based on moderator group mask
        overlay.created().then(() => {
            overlay.appearance.enabled = new MRE.GroupMask(this._app.context, [UserManager.MODERATOR_MASK]);
        })
    }

    public showMediaJsonInputOverlay(owner: MRE.User) {
        //const overlay = MRE.Actor.CreatePrimitive(this._app.assets, {
        //    definition: {
        //        shape: MRE.PrimitiveShape.Plane,
        //        dimensions: { x: 1, y: 1, z: 0.65 }
        //    },
        //    actor: {
        //        
        //    }
        //})

        // Setup panel with Configure button and Start button when configuration is successful.

        this.promptConfigureMediaPlayer(owner);
    }

    private async promptConfigureMediaPlayer(owner: MRE.User): Promise<void> {
        owner.prompt('Please input json string for media player configuration', true)
        .then(res => {
            if (!res.submitted) {
                // Need to reload to owner prompt.
                this.showOwnerOverlay();
                return;
            }
                
            if (res.text !== undefined && res.text !== null) {
                console.log(`Video config JSON: ${res.text}`);
                try {
                    this._app.mediaManager.setMediaConfigJson(res.text, owner).then(success => {
                        if (!success) {
                            console.log("Failed to validate and load media config JSON");
                            owner.prompt("Failed to validate and parse media config JSON");
                        } else {
                            console.log("Media configuration complete.  Starting the media player...")
                            this._app.startMediaPlayer();
                        }
                    });
                } catch {
                    console.log("Failed to parse the JSON data");
                    owner.prompt("Failed to parse JSON data.");
                }
            } else {
                owner.prompt("Input valid JSON string to configure media player.");
            }
        });
    }

    private configureMediaPlayer(jsonData: any) {

        
    }
}