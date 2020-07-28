/*!
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */

import * as MRE from "@microsoft/mixed-reality-extension-sdk";
import App from './app';	

export default class UserManager {
	private _users: MRE.User[] = [];
	private _moderators: MRE.User[] = [];
	private _mediaPlayerOwnerId: MRE.Guid;
	private _moderatorGroupMask: MRE.GroupMask;
	private _ownerGroupMask: MRE.GroupMask;

	public static readonly MODERATOR_MASK = "moderator";
	public static readonly OWNER_MASK = 'owner';

	public get moderatorGroupMask() { return this._moderatorGroupMask; }
	public get ownerGroupMask() { return this._ownerGroupMask; }

	public constructor(private _app: App) {
		this._moderatorGroupMask = new MRE.GroupMask(_app.context, UserManager.MODERATOR_MASK);
		this._ownerGroupMask = new MRE.GroupMask(_app.context, UserManager.OWNER_MASK);
	}
	
	public onUserJoined(user: MRE.User) {
		user.groups.clear();
		this._users.push(user);

		if (UserManager.isModerator(user)) {
			this._moderators.push(user);
			user.groups.add(UserManager.MODERATOR_MASK);
		}

		// Check to see if the user is already the owner of this media player.  If so, re-assign the role.
		if (user.id === this._mediaPlayerOwnerId) {
			user.groups.add(UserManager.OWNER_MASK);
		}
	}

	public onUserLeft(user: MRE.User) {
		user.groups.clear();
		this._users = this._users.filter(u => u.id !== user.id);
	}

	public setMediaPlayerOwner(ownerUserId: MRE.Guid) {
		this._mediaPlayerOwnerId = ownerUserId;

		const owner = this._users.find(u => u.id === ownerUserId);
		if (owner) {
			owner.groups.add(UserManager.OWNER_MASK);
		}
	}

	public clearMediaPlayerOwner() {
		const mediaPlayerOwner = this._users.find(u => u.id === this._mediaPlayerOwnerId);

		if (mediaPlayerOwner) {
			mediaPlayerOwner.groups.delete(UserManager.OWNER_MASK);
		}
		
		this._mediaPlayerOwnerId = null;
	}

	public static isModerator(user: MRE.User): boolean {
		return user.properties['altspacevr-roles'].includes('moderator');
	}
}