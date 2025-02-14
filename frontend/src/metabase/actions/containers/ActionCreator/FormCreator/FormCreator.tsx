import React, { useState, useEffect, useMemo } from "react";
import _ from "underscore";

import { ActionForm } from "metabase/actions/components/ActionForm";

import type { ActionFormSettings, Parameter } from "metabase-types/api";

import { getDefaultFormSettings, sortActionParams } from "../../../utils";
import { addMissingSettings } from "../utils";
import { hasNewParams } from "./utils";

import { EmptyFormPlaceholder } from "./EmptyFormPlaceholder";
import { FormCreatorWrapper } from "./FormCreator.styled";

function FormCreator({
  params,
  isEditable,
  formSettings: passedFormSettings,
  onChange,
  onExampleClick,
}: {
  params: Parameter[];
  isEditable: boolean;
  formSettings?: ActionFormSettings;
  onChange: (formSettings: ActionFormSettings) => void;
  onExampleClick: () => void;
}) {
  const [formSettings, setFormSettings] = useState<ActionFormSettings>(
    passedFormSettings?.fields ? passedFormSettings : getDefaultFormSettings(),
  );

  useEffect(() => {
    onChange(formSettings);
  }, [formSettings, onChange]);

  useEffect(() => {
    // add default settings for new parameters
    if (formSettings && params && hasNewParams(params, formSettings)) {
      setFormSettings(addMissingSettings(formSettings, params));
    }
  }, [params, formSettings]);

  const sortedParams = useMemo(
    () => params.sort(sortActionParams(formSettings)),
    [params, formSettings],
  );

  if (!sortedParams.length) {
    return (
      <FormCreatorWrapper>
        <EmptyFormPlaceholder onExampleClick={onExampleClick} />
      </FormCreatorWrapper>
    );
  }

  return (
    <FormCreatorWrapper>
      <ActionForm
        parameters={sortedParams}
        isEditable={isEditable}
        onClose={_.noop}
        onSubmit={_.noop}
        formSettings={formSettings}
        setFormSettings={setFormSettings}
      />
    </FormCreatorWrapper>
  );
}

export default FormCreator;
