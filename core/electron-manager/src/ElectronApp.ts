/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { isElectronRenderer } from "@bentley/bentleyjs-core";
import { IpcListener, IpcSocketFrontend, RpcInterfaceDefinition } from "@bentley/imodeljs-common";
import { AsyncMethodsOf, IModelAppOptions, IpcApp, NativeApp, PromiseReturnType } from "@bentley/imodeljs-frontend";
import { ITwinElectronApi } from "./ElectronPreload";
import { ElectronRpcManager } from "./ElectronRpcManager";

/** @alpha */
export interface ElectronAppOptions {
  /** A list of RPC interfaces to register */
  rpcInterfaces?: RpcInterfaceDefinition[];
}

/**
 * Frontend Ipc support for Electron apps.
 */
class ElectronIpc implements IpcSocketFrontend {
  private _api: ITwinElectronApi;
  public addListener(channelName: string, listener: IpcListener) {
    this._api.addListener(channelName, listener);
    return () => this._api.removeListener(channelName, listener);
  }
  public removeListener(channelName: string, listener: IpcListener) {
    this._api.removeListener(channelName, listener);
  }
  public send(channel: string, ...data: any[]) {
    this._api.send(channel, ...data);
  }
  public async invoke(channel: string, ...args: any[]) {
    return this._api.invoke(channel, ...args);
  }
  constructor() {
    // use the methods on window.itwinjs exposed by ElectronPreload.ts, or ipcRenderer directly if running with nodeIntegration=true (**only** for tests).
    // Note that `require("electron")` doesn't work with nodeIntegration=false - that's what it stops
    this._api = (window as any).itwinjs ?? require("electron").ipcRenderer;
  }
}

// Frontend of an Electron App.
export class ElectronApp {
  private static _ipc?: ElectronIpc;
  public static get isValid(): boolean { return undefined !== this._ipc; }

  /**
   * Start the frontend of an Electron application.
   * @param opts Options for your ElectronApp
   * @note This method must only be called from the frontend of an Electron app (i.e. when [isElectronRenderer]($bentley) is `true`).
   */
  public static async startup(opts?: { electronApp?: ElectronAppOptions, iModelApp?: IModelAppOptions }) {
    if (!isElectronRenderer)
      throw new Error("Not running under Electron");
    if (!this.isValid) {
      this._ipc = new ElectronIpc();
      ElectronRpcManager.initializeFrontend(this._ipc, opts?.electronApp?.rpcInterfaces);
    }
    await NativeApp.startup({ ipcApp: { ipc: this._ipc! }, ...opts });
  };

  public static async shutdown() {
    this._ipc = undefined;
    await NativeApp.shutdown();
  }

  /**
   * Call an asynchronous method in the [Electron.Dialog](https://www.electronjs.org/docs/api/dialog) interface from a previously initialized ElectronFrontend.
   * @param methodName the name of the method to call
   * @param args arguments to method
   */
  public static async callDialog<T extends AsyncMethodsOf<Electron.Dialog>>(methodName: T, ...args: Parameters<Electron.Dialog[T]>) {
    return IpcApp.callBackend("electron-safe", "callElectron", "dialog", methodName, ...args) as PromiseReturnType<Electron.Dialog[T]>;
  }
  /**
   * Call an asynchronous method in the [Electron.shell](https://www.electronjs.org/docs/api/shell) interface from a previously initialized ElectronFrontend.
   * @param methodName the name of the method to call
   * @param args arguments to method
   */
  public static async callShell<T extends AsyncMethodsOf<Electron.Shell>>(methodName: T, ...args: Parameters<Electron.Shell[T]>) {
    return IpcApp.callBackend("electron-safe", "callElectron", "shell", methodName, ...args) as PromiseReturnType<Electron.Shell[T]>;
  }
  /**
   * Call an asynchronous method in the [Electron.app](https://www.electronjs.org/docs/api/app) interface from a previously initialized ElectronFrontend.
   * @param methodName the name of the method to call
   * @param args arguments to method
   */
  public static async callApp<T extends AsyncMethodsOf<Electron.App>>(methodName: T, ...args: Parameters<Electron.App[T]>) {
    return IpcApp.callBackend("electron-safe", "callElectron", "app", methodName, ...args) as PromiseReturnType<Electron.App[T]>;
  }
};
