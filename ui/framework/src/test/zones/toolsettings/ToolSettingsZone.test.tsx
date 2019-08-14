/*---------------------------------------------------------------------------------------------
* Copyright (c) 2019 Bentley Systems, Incorporated. All rights reserved.
* Licensed under the MIT License. See LICENSE.md in the project root for license terms.
*--------------------------------------------------------------------------------------------*/
import * as React from "react";
import { expect } from "chai";
import { mount } from "enzyme";

import TestUtils from "../../TestUtils";
import {
  ConfigurableUiManager,
  ToolUiProvider,
  ConfigurableCreateInfo,
  FrontstageProvider,
  FrontstageProps,
  Frontstage,
  Zone,
  Widget,
  FrontstageManager,
  FrontstageComposer,
  CoreTools,
} from "../../../ui-framework";
import { Tool1 } from "../../tools/Tool1";
import { WidgetState } from "../../../ui-framework/widgets/WidgetDef";

describe("ToolSettingsZone", () => {

  class Tool1UiProvider extends ToolUiProvider {
    constructor(info: ConfigurableCreateInfo, options: any) {
      super(info, options);

      this.toolSettingsNode = <Tool1Settings />;
    }

    public execute(): void {
    }
  }

  class Tool1Settings extends React.Component {
    public render(): React.ReactNode {
      return (
        <div>
          <table>
            <tbody>
              <tr>
                <th>Type</th>
                <th>Input</th>
              </tr>
              <tr>
                <td>Month</td>
                <td> <input type="month" /> </td>
              </tr>
            </tbody>
          </table>
        </div>
      );
    }
  }

  const testToolId = Tool1.toolId;

  before(async () => {
    await TestUtils.initializeUiFramework();

    class Frontstage1 extends FrontstageProvider {
      public get frontstage(): React.ReactElement<FrontstageProps> {
        return (
          <Frontstage
            id="ToolSettingsZone-TestFrontstage"
            defaultTool={CoreTools.selectElementCommand}
            defaultLayout="FourQuadrants"
            contentGroup="TestContentGroup1"
            topCenter={
              <Zone
                widgets={[
                  <Widget isToolSettings={true} />,
                ]}
              />
            }
          />
        );
      }
    }
    ConfigurableUiManager.addFrontstageProvider(new Frontstage1());

    class Frontstage2 extends FrontstageProvider {
      public get frontstage(): React.ReactElement<FrontstageProps> {
        return (
          <Frontstage
            id="ToolSettingsZone-TestFrontstage2"
            defaultTool={CoreTools.selectElementCommand}
            defaultLayout="FourQuadrants"
            contentGroup="TestContentGroup1"
            topCenter={
              <Zone
                widgets={[
                  <Widget isToolSettings={true} defaultState={WidgetState.Closed} />,
                ]}
              />
            }
          />
        );
      }
    }
    ConfigurableUiManager.addFrontstageProvider(new Frontstage2());

    ConfigurableUiManager.registerControl(testToolId, Tool1UiProvider);
  });

  after(() => {
    TestUtils.terminateUiFramework();
  });

  it("close button closes it & tab opens it", async () => {
    // ToolSetting should open by default if a ToolUiProvider is specified for tool.
    await FrontstageManager.setActiveFrontstageDef(undefined);

    const wrapper = mount(<FrontstageComposer />);

    const frontstageDef = FrontstageManager.findFrontstageDef("ToolSettingsZone-TestFrontstage");
    expect(frontstageDef).to.not.be.undefined;

    if (frontstageDef) {
      await FrontstageManager.setActiveFrontstageDef(frontstageDef);

      FrontstageManager.ensureToolInformationIsSet(testToolId);
      FrontstageManager.setActiveToolId(testToolId);
      expect(FrontstageManager.activeToolId).to.eq(testToolId);

      wrapper.update();

      // it should be open by default
      const toolSettings = wrapper.find(".nz-widget-toolSettings");
      expect(toolSettings.length).to.eq(1);
      expect(wrapper.find(".nz-footer-dialog-button").length).to.eq(1);

      // simulate click to close it
      wrapper.find(".nz-footer-dialog-button").simulate("click");
      wrapper.update();
      expect(wrapper.find(".nz-widget-toolSettings").length).to.eq(0);
      expect(wrapper.find(".nz-footer-dialog-button").length).to.eq(0);

      // simulate click to open it
      wrapper.find(".nz-widget-toolSettings-tab").simulate("keyDown", { key: "Escape" });

      wrapper.find(".nz-widget-toolSettings-tab").simulate("click");
      wrapper.update();
      expect(wrapper.find(".nz-widget-toolSettings").length).to.eq(1);
      expect(wrapper.find(".nz-footer-dialog-button").length).to.eq(1);
    }

    wrapper.unmount();
  });

  it("should be closed with defaultState of Closed", async () => {
    // ToolSettings should closed by default.
    await FrontstageManager.setActiveFrontstageDef(undefined);

    const wrapper = mount(<FrontstageComposer />);

    const frontstageDef = FrontstageManager.findFrontstageDef("ToolSettingsZone-TestFrontstage2");
    expect(frontstageDef).to.not.be.undefined;

    if (frontstageDef) {
      await FrontstageManager.setActiveFrontstageDef(frontstageDef);

      FrontstageManager.ensureToolInformationIsSet(testToolId);
      FrontstageManager.setActiveToolId(testToolId);
      expect(FrontstageManager.activeToolId).to.eq(testToolId);

      wrapper.update();

      // it should be closed by default
      expect(wrapper.find(".nz-widget-toolSettings").length).to.eq(0);
      expect(wrapper.find(".nz-footer-dialog-button").length).to.eq(0);
    }

    wrapper.unmount();
  });

});
