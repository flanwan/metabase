import React from "react";
import { t } from "ttag";

import Icon from "metabase/components/Icon";

import { getVisualizationRaw } from "metabase/visualizations";

import {
  Dashboard,
  DashboardOrderedCard,
  VisualizationSettings,
} from "metabase-types/api";
import { Series } from "metabase-types/types/Visualization";

import { isActionDashCard } from "metabase/actions/utils";
import Metadata from "metabase-lib/metadata/Metadata";

import DashCardActionButton from "./DashCardActionButton";

import AddSeriesButton from "./AddSeriesButton";
import ChartSettingsButton from "./ChartSettingsButton";

import { DashCardActionButtonsContainer } from "./DashCardActionButtons.styled";
import ActionSettingsButton from "./ActionSettingsButton";

interface Props {
  series: Series;
  dashboard: Dashboard;
  dashcard?: DashboardOrderedCard;
  isLoading: boolean;
  isVirtualDashCard: boolean;
  isPreviewing: boolean;
  hasError: boolean;
  onRemove: () => void;
  onAddSeries: () => void;
  onReplaceAllVisualizationSettings: (settings: VisualizationSettings) => void;
  showClickBehaviorSidebar: () => void;
  onPreviewToggle: () => void;
  metadata: Metadata;
}

function DashCardActionButtons({
  series,
  dashboard,
  dashcard,
  isLoading,
  isVirtualDashCard,
  isPreviewing,
  hasError,
  onRemove,
  onAddSeries,
  onReplaceAllVisualizationSettings,
  showClickBehaviorSidebar,
  onPreviewToggle,
  metadata,
}: Props) {
  const { disableSettingsConfig, supportPreviewing, supportsSeries } =
    getVisualizationRaw(series).visualization;

  const buttons = [];

  if (supportPreviewing) {
    buttons.push(
      <DashCardActionButton
        onClick={onPreviewToggle}
        tooltip={isPreviewing ? t`Edit` : t`Preview`}
        analyticsEvent="Dashboard;Text;edit"
      >
        {isPreviewing ? (
          <DashCardActionButton.Icon name="edit_document" />
        ) : (
          <DashCardActionButton.Icon name="eye" size={18} />
        )}
      </DashCardActionButton>,
    );
  }

  if (!isLoading && !hasError) {
    if (onReplaceAllVisualizationSettings && !disableSettingsConfig) {
      buttons.push(
        <ChartSettingsButton
          key="chart-settings-button"
          series={series}
          dashboard={dashboard}
          dashcard={dashcard}
          metadata={metadata}
          onReplaceAllVisualizationSettings={onReplaceAllVisualizationSettings}
        />,
      );
    }

    if (!isVirtualDashCard) {
      buttons.push(
        <DashCardActionButton
          key="click-behavior-tooltip"
          tooltip={t`Click behavior`}
          analyticsEvent="Dashboard;Open Click Behavior Sidebar"
          onClick={showClickBehaviorSidebar}
        >
          <Icon name="click" />
        </DashCardActionButton>,
      );
    }

    if (supportsSeries) {
      buttons.push(
        <AddSeriesButton
          key="add-series-button"
          series={series}
          onClick={onAddSeries}
        />,
      );
    }

    if (dashcard && isActionDashCard(dashcard)) {
      buttons.push(
        <ActionSettingsButton
          key="action-settings-button"
          dashboard={dashboard}
          dashcard={dashcard}
        />,
      );
    }
  }

  return (
    <DashCardActionButtonsContainer>
      {buttons}
      <DashCardActionButton
        onClick={onRemove}
        tooltip={t`Remove`}
        analyticsEvent="Dashboard;Remove Card Modal"
      >
        <DashCardActionButton.Icon name="close" />
      </DashCardActionButton>
    </DashCardActionButtonsContainer>
  );
}

export default DashCardActionButtons;
