import {WorkerIdentity} from "./WorkerIdentity";

export enum ClientType {
    Worker = 0,
    RemoteCLI
}

export enum TaskStatus {
    Idle = 0,
    Running,
    Error
}

export class ClientIdentifier {
    public clientType: ClientType = ClientType.Worker;
    public clientId: any = null;
    public token: string;
    public groupId: string;
    public instanceId: string;
    public commitId?: string;
    public latestReceivedPingTimestamp: number = 0;
    public taskStatus: TaskStatus = TaskStatus.Idle;
    public ip: any = null;
    public reconnect: number = 0;
    public identity?: WorkerIdentity;

    constructor(groupId: string, instanceId: string) {
        this.groupId = groupId;
        this.instanceId = instanceId;
        this.token = this._generateHash();
    }

    /**
     * Generate unique key
     * @returns {string}
     * @private
     */
    private _generateHash(){
        return Math.random().toString(36).substring(2, 15);
    }

    /**
     * Get identity for workers ONLY
     * @returns {WorkerIdentity}
     */
    public getWorkerIdentity(){
        return this.identity;
    }

    /**
     * Set the identity wor workers ONLY
     * @param {WorkerIdentity} identity
     */
    public setWorkerIdentity(identity: WorkerIdentity){
        this.identity = identity;
    }
}

