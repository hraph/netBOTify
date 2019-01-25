"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Client_1 = require("./Client");
const ClientIdentifier_1 = require("../models/ClientIdentifier");
const logger_1 = require("../logger");
const EventEmitter = require("events");
class Worker extends Client_1.Client {
    constructor(config = {}) {
        super(config);
        this.taskEvent = new EventEmitter();
        try {
            if (config.logger)
                logger_1.logger.setWorkerLevel(config.logger);
            this.client.ready((serverProxy) => {
                logger_1.logger.worker().debug('Connected to server');
            });
            this.client.onConnect((client) => {
                if (this.client.isReady())
                    logger_1.logger.worker().debug('Reconnected to server');
            });
            this.client.onUnhandledMessage(function (data) {
                logger_1.logger.worker().debug('Received message: ', data);
            });
            this.client.onError(function (e) {
                if (e.type === "TransportError") {
                    logger_1.logger.worker().error("Unable to connect to server: code", e.description);
                }
                else {
                    logger_1.logger.worker().error('Unknown error ', e);
                }
            });
            this.client.onConnectionLost(function () {
                logger_1.logger.worker().warn('Connection lost ... will try to reconnect');
            });
            this.client.onConnectionRetry(function (socket) {
                logger_1.logger.worker().warn('retrying ...');
            });
            this.client.onDisconnect(function (socket) {
                logger_1.logger.worker().debug('Client disconnected ', socket.id);
            });
            this._internalActions(this);
        }
        catch (e) {
            logger_1.logger.worker().error("Error while constructing worker: " + e);
            process.exit(1);
        }
    }
    _internalActions(__this) {
        this.client.exports.launchTask = function (identity, parameters) {
            __this.taskEvent.emit("launchTask", identity, parameters, __this.server);
            __this.server.task.taskLaunched().catch((e) => {
                logger_1.logger.worker().error("Unable to execute command ", e);
            });
            __this.identifier.taskStatus = ClientIdentifier_1.TaskStatus.Running;
        };
        this.client.exports.stopTask = function () {
            __this.taskEvent.emit("stopTask", __this.server);
            __this.server.task.taskStopped().catch((e) => {
                logger_1.logger.worker().error("Unable to execute command ", e);
            });
            __this.identifier.taskStatus = ClientIdentifier_1.TaskStatus.Idle;
        };
        this.client.exports.statusTask = function () {
            let context = this;
            context.async = true;
            if (__this.onGetStatusCallback != null)
                return __this.onGetStatusCallback(__this.server).then(data => context.return(data));
            else
                context.return(null);
        };
        this.client.exports.workerOnEvent = function (eventName, data = null) {
            __this.taskEvent.emit("serverEvent:" + eventName, __this.server, data);
        };
    }
    onLaunchTask(callback) {
        this.taskEvent.on("launchTask", callback);
    }
    onStopTask(callback) {
        this.taskEvent.on("stopTask", callback);
    }
    onStatusTask(callback) {
        this.onGetStatusCallback = callback;
    }
    onServerEvent(eventName, callback) {
        this.taskEvent.on("serverEvent:" + eventName, callback);
    }
    sendTaskResult(result = null) {
        if (this.server !== null)
            this.server.task.taskResult(result);
    }
    sendTaskEvent(eventName, data = null) {
        if (this.server !== null)
            this.server.task.taskEvent(eventName, data);
    }
    sendTaskError(error = null) {
        if (this.server !== null)
            this.server.task.taskError(error);
        this.identifier.taskStatus = ClientIdentifier_1.TaskStatus.Error;
    }
    sendTaskEnded(data = null) {
        if (this.server !== null)
            this.server.task.taskEnded(data);
        this.identifier.taskStatus = ClientIdentifier_1.TaskStatus.Ended;
    }
    sendB64Image(fileName, extension, buffer) {
        if (this.server !== null)
            this.server.task.b64Image(fileName, extension, buffer);
    }
    logger() {
        return logger_1.logger.worker();
    }
}
exports.Worker = Worker;
//# sourceMappingURL=Worker.js.map