import React from "react";
import type { FieldSettings } from "metabase-types/api";
import type { TemplateTag } from "metabase-types/types/Query";

import { getWidgetComponent } from "metabase/components/form/FormWidget";

import { getFormField } from "./utils";

// sample form fields
export function FormField({
  tag,
  fieldSettings,
}: {
  tag: TemplateTag;
  fieldSettings: FieldSettings;
}) {
  const fieldProps = getFormField(tag, fieldSettings);
  const InputField = getWidgetComponent(fieldProps);
  return <InputField field={fieldProps} {...fieldProps} />;
}
