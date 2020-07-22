import * as MRE from "@microsoft/mixed-reality-extension-sdk";
import App from './app';

export default class UserManager {
    private _users: MRE.User[] = [];
    private _moderators: MRE.User[] = [];
    private _mediaPlayerOwner: MRE.User;
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
    }

    public setMediaPlayerOwner(user: MRE.User) {
        if (UserManager.isModerator(user)) {
            this._mediaPlayerOwner = user;
            user.groups.add(UserManager.OWNER_MASK);
        } else {
            console.log(" Non moderator user trying to own the poll.");
        }
    }

    public static isModerator(user: MRE.User): boolean {
        return user.properties['altspacevr-roles'].includes('moderator');
    }
}