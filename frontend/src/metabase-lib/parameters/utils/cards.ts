import { Parameter } from "metabase-types/api";
import { ParameterTarget } from "metabase-types/types/Parameter";
import { Card } from "metabase-types/types/Card";
import {
  ParameterWithTarget,
  UiParameter,
} from "metabase-lib/parameters/types";
import { getValuePopulatedParameters } from "metabase-lib/parameters/utils/parameter-values";
import { getParameterTargetField } from "metabase-lib/parameters/utils/targets";
import { buildQuestion } from "metabase-lib/Question";
import Metadata from "metabase-lib/metadata/Metadata";
import { getParametersFromCard } from "metabase-lib/parameters/utils/template-tags";

export function getCardUiParameters(
  card: Card,
  metadata: Metadata,
  parameterValues: { [key: string]: any } = {},
  parameters = getParametersFromCard(card),
): UiParameter[] {
  if (!card) {
    return [];
  }

  const valuePopulatedParameters: (Parameter[] | ParameterWithTarget[]) & {
    value?: any;
  } = getValuePopulatedParameters(parameters, parameterValues);
  const question = buildQuestion({ card, metadata });

  return valuePopulatedParameters.map(parameter => {
    const target: ParameterTarget | undefined = (
      parameter as ParameterWithTarget
    ).target;
    const field = getParameterTargetField(target, metadata, question);
    if (field) {
      return {
        ...parameter,
        fields: [field],
        hasVariableTemplateTagTarget: false,
      };
    }

    return { ...parameter, hasVariableTemplateTagTarget: true };
  });
}
