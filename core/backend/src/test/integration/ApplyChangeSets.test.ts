/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { GuidString, Logger, LogLevel } from "@bentley/bentleyjs-core";
import { AuthorizedClientRequestContext } from "@bentley/itwin-client";
import { TestUsers, TestUtility } from "@bentley/oidc-signin-tool";
import { assert } from "chai";
import * as path from "path";
import { KnownLocations, NativeLoggerCategory } from "../../imodeljs-backend";
import { IModelTestUtils } from "../IModelTestUtils";
import { HubUtility } from "./HubUtility";
import { getTestProjectId, getTestiModelId, TestiModels } from "./TestIModelsUtility";

// Useful utilities to download/upload test cases from/to iModelHub
describe("ApplyChangeSets (#integration)", () => {
  const iModelRootDir = path.join(KnownLocations.tmpdir, "IModelJsTest/");

  before(async () => {
    // Note: Change to LogLevel.Info for useful debug information
    Logger.setLevel(HubUtility.logCategory, LogLevel.Error);
    Logger.setLevel(NativeLoggerCategory.DgnCore, LogLevel.Error);
    Logger.setLevel(NativeLoggerCategory.BeSQLite, LogLevel.Error);
  });

  const testAllChangeSetOperations = async (requestContext: AuthorizedClientRequestContext, projectId: string, iModelId: GuidString) => {
    requestContext.enter();
    const iModelDir = path.join(iModelRootDir, iModelId.toString());
    return HubUtility.validateAllChangeSetOperations(requestContext, projectId, iModelId, iModelDir);
  };

  const testOpen = async (requestContext: AuthorizedClientRequestContext, projectId: string, iModelId: string) => {
    requestContext.enter();
    const iModelDb = await IModelTestUtils.downloadAndOpenCheckpoint({ requestContext, contextId: projectId, iModelId });
    requestContext.enter();
    assert(!!iModelDb);
  };

  const testAllOperations = async (requestContext: AuthorizedClientRequestContext, projectId: string, iModelId: GuidString) => {
    requestContext.enter();
    await testOpen(requestContext, projectId, iModelId);
    requestContext.enter();
    await testAllChangeSetOperations(requestContext, projectId, iModelId);
    requestContext.enter();
  };

  it("should test all change set operations after downloading iModel from the hub (#integration)", async () => {
    console.log(`Downloading/Uploading iModels to/from ${iModelRootDir}`); // eslint-disable-line no-console

    const requestContext = await TestUtility.getAuthorizedClientRequestContext(TestUsers.regular);

    let projectId = await getTestProjectId(requestContext);
    let iModelId = await getTestiModelId(requestContext, TestiModels.readOnly);
    await testAllOperations(requestContext, projectId, iModelId);
    requestContext.enter();

    iModelId = await getTestiModelId(requestContext, TestiModels.readWrite);
    requestContext.enter();
    await testAllOperations(requestContext, projectId, iModelId);
    requestContext.enter();

    iModelId = await getTestiModelId(requestContext, TestiModels.noVersions);
    requestContext.enter();
    await testAllOperations(requestContext, projectId, iModelId);
  });
});
