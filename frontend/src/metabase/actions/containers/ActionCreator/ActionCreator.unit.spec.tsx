import React from "react";
import nock from "nock";
import userEvent, { specialChars } from "@testing-library/user-event";

import {
  renderWithProviders,
  screen,
  waitFor,
  waitForElementToBeRemoved,
  getIcon,
  queryIcon,
} from "__support__/ui";
import {
  setupCardsEndpoints,
  setupDatabasesEndpoints,
} from "__support__/server-mocks";
import { SAMPLE_DATABASE } from "__support__/sample_database_fixture";

import {
  createMockActionParameter,
  createMockCard,
  createMockQueryAction,
  createMockUser,
} from "metabase-types/api/mocks";
import {
  createMockSettingsState,
  createMockState,
} from "metabase-types/store/mocks";

import type { Card, WritebackQueryAction } from "metabase-types/api";
import type Database from "metabase-lib/metadata/Database";
import type Table from "metabase-lib/metadata/Table";

import ActionCreator from "./ActionCreator";

function getDatabaseObject(database: Database) {
  return {
    ...database.getPlainObject(),
    tables: database.tables.map(getTableObject),
  };
}

function getTableObject(table: Table) {
  return {
    ...table.getPlainObject(),
    schema: table.schema_name,
  };
}

type SetupOpts = {
  action?: WritebackQueryAction;
  model?: Card;
  isAdmin?: boolean;
  isPublicSharingEnabled?: boolean;
};

async function setup({
  action,
  model = createMockCard({ dataset: true, can_write: true }),
  isAdmin,
  isPublicSharingEnabled,
}: SetupOpts = {}) {
  const scope = nock(location.origin);

  setupDatabasesEndpoints(scope, [getDatabaseObject(SAMPLE_DATABASE)]);
  setupCardsEndpoints(scope, [createMockCard(model)]);

  if (action) {
    scope.get(`/api/action/${action.id}`).reply(200, action);
    scope.delete(`/api/action/${action.id}/public_link`).reply(204);
    scope
      .post(`/api/action/${action.id}/public_link`)
      .reply(200, { uuid: "mock-uuid" });
  }

  renderWithProviders(
    <ActionCreator actionId={action?.id} modelId={model.id} />,
    {
      withSampleDatabase: true,
      storeInitialState: createMockState({
        currentUser: createMockUser({
          is_superuser: isAdmin,
        }),
        settings: createMockSettingsState({
          "enable-public-sharing": isPublicSharingEnabled,
          "site-url": SITE_URL,
        }),
      }),
    },
  );

  await waitForElementToBeRemoved(() =>
    screen.queryByTestId("loading-spinner"),
  );
}

async function setupEditing({
  action = createMockQueryAction(),
  ...opts
}: SetupOpts = {}) {
  await setup({ action, ...opts });
  return { action };
}

const SITE_URL = "http://localhost:3000";

describe("ActionCreator", () => {
  afterEach(() => {
    nock.cleanAll();
  });

  describe("new action", () => {
    it("renders correctly", async () => {
      await setup();

      expect(screen.getByText(/New action/i)).toBeInTheDocument();
      expect(
        screen.getByTestId("mock-native-query-editor"),
      ).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: "Update" }),
      ).not.toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Cancel" }),
      ).toBeInTheDocument();
    });

    it("should disable submit by default", async () => {
      await setup();
      expect(screen.getByRole("button", { name: "Save" })).toBeDisabled();
      expect(screen.getByRole("button", { name: "Cancel" })).toBeEnabled();
    });

    it("should show clickable data reference icon", async () => {
      await setup();
      getIcon("reference", "button").click();

      expect(screen.getByText("Data Reference")).toBeInTheDocument();
      expect(screen.getByText(SAMPLE_DATABASE.name)).toBeInTheDocument();
    });

    it("should show action settings button", async () => {
      await setup({ isAdmin: true, isPublicSharingEnabled: true });
      expect(
        screen.getByRole("button", { name: "Action settings" }),
      ).toBeInTheDocument();
    });
  });

  describe("editing action", () => {
    it("renders correctly", async () => {
      const { action } = await setupEditing();

      expect(screen.getByText(action.name)).toBeInTheDocument();
      expect(screen.queryByText(/New action/i)).not.toBeInTheDocument();
      expect(
        screen.getByTestId("mock-native-query-editor"),
      ).toBeInTheDocument();
      expect(
        await screen.findByRole("button", { name: "Update" }),
      ).toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: "Create" }),
      ).not.toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Cancel" }),
      ).toBeInTheDocument();
    });

    it("renders parameters", async () => {
      const action = createMockQueryAction({
        parameters: [createMockActionParameter({ name: "FooBar" })],
      });
      await setupEditing({ action });

      expect(screen.getByText("FooBar")).toBeInTheDocument();
    });

    it("blocks editing if a user doesn't have editing permissions", async () => {
      const action = createMockQueryAction({
        parameters: [createMockActionParameter({ name: "FooBar" })],
      });
      const model = createMockCard({
        can_write: false,
      });
      await setupEditing({ action, model, isAdmin: false });

      expect(screen.getByDisplayValue(action.name)).toBeDisabled();
      expect(queryIcon("grabber2")).not.toBeInTheDocument();
      expect(screen.queryByLabelText("Field settings")).not.toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: "Update" }),
      ).not.toBeInTheDocument();

      screen.getByLabelText("Action settings").click();

      expect(screen.getByLabelText("Success message")).toBeDisabled();
    });

    describe("admin users and has public sharing enabled", () => {
      const mockUuid = "mock-uuid";

      it("should show action settings button", async () => {
        await setupEditing({
          isAdmin: true,
          isPublicSharingEnabled: true,
        });

        expect(
          screen.getByRole("button", { name: "Action settings" }),
        ).toBeInTheDocument();
      });

      it("should be able to enable action public sharing", async () => {
        await setupEditing({
          isAdmin: true,
          isPublicSharingEnabled: true,
        });

        screen.getByRole("button", { name: "Action settings" }).click();

        expect(screen.getByText("Action settings")).toBeInTheDocument();
        const makePublicToggle = screen.getByRole("switch", {
          name: "Make public",
        });
        expect(makePublicToggle).not.toBeChecked();
        expect(
          screen.queryByRole("textbox", { name: "Public action link URL" }),
        ).not.toBeInTheDocument();

        screen.getByRole("switch", { name: "Make public" }).click();

        await waitFor(() => {
          expect(makePublicToggle).toBeChecked();
        });

        const expectedPublicLinkUrl = `${SITE_URL}/public/action/${mockUuid}`;
        expect(
          screen.getByRole("textbox", { name: "Public action link URL" }),
        ).toHaveValue(expectedPublicLinkUrl);
      });

      it("should be able to disable action public sharing", async () => {
        await setupEditing({
          action: createMockQueryAction({ public_uuid: mockUuid }),
          isAdmin: true,
          isPublicSharingEnabled: true,
        });
        screen.getByRole("button", { name: "Action settings" }).click();

        expect(screen.getByText("Action settings")).toBeInTheDocument();
        const makePublicToggle = screen.getByRole("switch", {
          name: "Make public",
        });
        expect(makePublicToggle).toBeChecked();
        const expectedPublicLinkUrl = `${SITE_URL}/public/action/${mockUuid}`;
        expect(
          screen.getByRole("textbox", { name: "Public action link URL" }),
        ).toHaveValue(expectedPublicLinkUrl);

        makePublicToggle.click();
        expect(
          screen.getByRole("heading", { name: "Disable this public link?" }),
        ).toBeInTheDocument();
        screen.getByRole("button", { name: "Yes" }).click();

        await waitFor(() => {
          expect(makePublicToggle).not.toBeChecked();
        });

        expect(
          screen.queryByRole("textbox", { name: "Public action link URL" }),
        ).not.toBeInTheDocument();
      });

      it("should be able to set success message", async () => {
        await setupEditing();

        userEvent.click(
          screen.getByRole("button", { name: "Action settings" }),
        );

        const messageBox = screen.getByRole("textbox", {
          name: "Success message",
        });
        expect(messageBox).toHaveValue("Thanks for your submission.");

        await waitFor(() => expect(messageBox).toBeEnabled());
        userEvent.type(messageBox, `${specialChars.selectAll}Thanks!`);
        expect(messageBox).toHaveValue("Thanks!");
      });
    });

    describe("no permission to see public sharing", () => {
      it("should not show sharing settings when user is admin but public sharing is disabled", async () => {
        await setupEditing({
          isAdmin: true,
          isPublicSharingEnabled: false,
        });

        userEvent.click(
          screen.getByRole("button", { name: "Action settings" }),
        );
        expect(
          screen.queryByRole("switch", {
            name: "Make public",
          }),
        ).not.toBeInTheDocument();
      });

      it("should not show sharing settings when user is not admin but public sharing is enabled", async () => {
        await setupEditing({
          isAdmin: false,
          isPublicSharingEnabled: true,
        });

        userEvent.click(
          screen.getByRole("button", { name: "Action settings" }),
        );
        expect(
          screen.queryByRole("switch", {
            name: "Make public",
          }),
        ).not.toBeInTheDocument();
      });
    });
  });
});
