import {
  restore,
  modal,
  enableActionsForDB,
  createAction,
} from "__support__/e2e/helpers";
import { SAMPLE_DATABASE } from "__support__/e2e/cypress_sample_database";
import { SAMPLE_DB_ID } from "__support__/e2e/cypress_data";

const { ORDERS_ID } = SAMPLE_DATABASE;

const DEFAULT_ACTION_DETAILS = {
  database_id: SAMPLE_DB_ID,
  dataset_query: {
    database: SAMPLE_DB_ID,
    native: {
      query: "UPDATE orders SET quantity = 0 WHERE id = {{order_id}}",
      "template-tags": {
        order_id: {
          "display-name": "Order ID",
          id: "fake-uuid",
          name: "order_id",
          type: "text",
        },
      },
    },
    type: "native",
  },
  name: "Reset order quantity",
  description: "Set order quantity to 0",
  type: "query",
  parameters: [
    {
      id: "fake-uuid",
      hasVariableTemplateTagTarget: true,
      name: "Order ID",
      slug: "order_id",
      type: "string/=",
      target: ["variable", ["template-tag", "fake-uuid"]],
    },
  ],
  visualization_settings: {
    fields: {
      "fake-uuid": {
        id: "fake-uuid",
        fieldType: "string",
        inputType: "string",
        hidden: false,
        order: 999,
        required: true,
        name: "",
        title: "",
        placeholder: "",
        description: "",
      },
    },
    type: "button",
  },
};

describe("scenarios > admin > settings > public sharing", () => {
  beforeEach(() => {
    restore();
    cy.signInAsAdmin();
  });

  it("should be able to toggle public sharing", () => {
    cy.visit("/admin/settings/public-sharing");
    cy.findByLabelText("Enable Public Sharing")
      .should("be.checked")
      .click()
      .should("not.be.checked");
  });

  it("should see public dashboards", () => {
    const expectedDashboardName = "Public dashboard";
    const expectedDashboardSlug = "public-dashboard";
    cy.createQuestionAndDashboard({
      dashboardDetails: {
        name: expectedDashboardName,
      },
      questionDetails: {
        name: "Question",
        query: {
          "source-table": ORDERS_ID,
        },
      },
    })
      .then(({ body }) => {
        const dashboardId = body.dashboard_id;
        cy.wrap(dashboardId).as("dashboardId");
        cy.request("POST", `/api/dashboard/${dashboardId}/public_link`, {});
      })
      .then(response => {
        cy.wrap(response.body.uuid).as("dashboardUuid");
      });

    cy.visit("/admin/settings/public-sharing");

    cy.findByText("Shared Dashboards").should("be.visible");
    cy.findByText(expectedDashboardName).should("be.visible");
    cy.get("@dashboardUuid").then(dashboardUuid => {
      cy.findByText(
        `${location.origin}/public/dashboard/${dashboardUuid}`,
      ).click();
      cy.findByRole("heading", { name: expectedDashboardName }).should(
        "be.visible",
      );
      cy.visit("/admin/settings/public-sharing");
    });

    cy.get("@dashboardId").then(dashboardId => {
      cy.findByText(expectedDashboardName).click();
      cy.url().should(
        "eq",
        `${location.origin}/dashboard/${dashboardId}-${expectedDashboardSlug}`,
      );
      cy.visit("/admin/settings/public-sharing");
    });

    cy.button("Revoke link").click();
    modal().within(() => {
      cy.findByText("Disable this link?").should("be.visible");
      cy.button("Yes").click();
    });
    cy.findByText("No dashboards have been publicly shared yet.").should(
      "be.visible",
    );
  });

  it("should see public questions", () => {
    const expectedQuestionName = "Public question";
    const expectedQuestionSlug = "public-question";
    cy.createQuestion({
      name: expectedQuestionName,
      query: {
        "source-table": ORDERS_ID,
      },
    })
      .then(({ body }) => {
        const questionId = body.id;
        cy.wrap(questionId).as("questionId");
        cy.request("POST", `/api/card/${questionId}/public_link`, {});
      })
      .then(response => {
        cy.wrap(response.body.uuid).as("questionUuid");
      });

    cy.visit("/admin/settings/public-sharing");

    cy.findByText("Shared Questions").should("be.visible");
    cy.findByText(expectedQuestionName).should("be.visible");
    cy.get("@questionUuid").then(questionUuid => {
      cy.findByText(
        `${location.origin}/public/question/${questionUuid}`,
      ).click();
      cy.findByRole("heading", { name: expectedQuestionName }).should(
        "be.visible",
      );
      cy.visit("/admin/settings/public-sharing");
    });

    cy.get("@questionId").then(questionId => {
      cy.findByText(expectedQuestionName).click();
      cy.url().should(
        "eq",
        `${location.origin}/question/${questionId}-${expectedQuestionSlug}`,
      );
      cy.visit("/admin/settings/public-sharing");
    });

    cy.button("Revoke link").click();
    modal().within(() => {
      cy.findByText("Disable this link?").should("be.visible");
      cy.button("Yes").click();
    });
    cy.findByText("No questions have been publicly shared yet.").should(
      "be.visible",
    );
  });

  it("should see public actions", () => {
    enableActionsForDB();
    const expectedActionName = "Public action";

    cy.createQuestion({
      name: "Model",
      query: {
        "source-table": ORDERS_ID,
      },
      dataset: true,
    }).then(({ body }) => {
      const modelId = body.id;
      cy.wrap(modelId).as("modelId");
    });

    cy.get("@modelId").then(modelId => {
      createAction({
        ...DEFAULT_ACTION_DETAILS,
        name: expectedActionName,
        model_id: modelId,
      }).then(({ body }) => {
        const actionId = body.id;
        cy.wrap(actionId).as("actionId");
      });
    });

    cy.get("@actionId")
      .then(actionId => {
        cy.request("POST", `/api/action/${actionId}/public_link`, {});
      })
      .then(({ body }) => {
        cy.wrap(body.uuid).as("actionUuid");
      });

    cy.visit("/admin/settings/public-sharing");

    cy.findByText("Shared Actions").should("be.visible");
    cy.findByText(expectedActionName).should("be.visible");
    cy.get("@actionUuid").then(actionUuid => {
      cy.findByText(`${location.origin}/public/action/${actionUuid}`).click();
      cy.findByRole("heading", { name: expectedActionName }).should(
        "be.visible",
      );
      cy.visit("/admin/settings/public-sharing");
    });

    cy.then(function () {
      cy.findByText(expectedActionName).click();
      cy.url().should(
        "eq",
        `${location.origin}/model/${this.modelId}/detail/actions/${this.actionId}`,
      );
      cy.findByRole("dialog").within(() => {
        cy.findByText(expectedActionName).should("be.visible");
      });
      cy.visit("/admin/settings/public-sharing");
    });

    cy.button("Revoke link").click();
    modal().within(() => {
      cy.findByText("Disable this link?").should("be.visible");
      cy.button("Yes").click();
    });
    cy.findByText("No actions have been publicly shared yet.").should(
      "be.visible",
    );
  });
});
