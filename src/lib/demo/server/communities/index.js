import { ME } from "../people";
import { serve } from "../serve";
import { IDS, freshBuildForm, seedForms, seedWorkflow } from "./seed";
import { createResponses } from "./responses";
import { createAdmin, responseTotals } from "./admin";
import { createDatabase } from "./database";
import { createTemplates } from "./templates";
import { createStudio } from "./studio";
import { createApplicant } from "./applicant";

export function createCommunitiesServer() {
  const forms = seedForms();
  const workflow = seedWorkflow();
  const totals = responseTotals();
  const responses = createResponses(forms);
  const admin = createAdmin({ forms, workflow, responses, totals });
  const database = createDatabase({ forms, store: responses, totals, metricsOf: admin.metricsOf, membership: admin.membership });
  forms[IDS.FB] = freshBuildForm();
  const templates = createTemplates();
  const studio = createStudio({ forms, formContract: admin.formContract });
  const applicant = createApplicant({ forms, workflow, responses });

  const server = serve(({ persona, user, method, pathname, params, body }) => (persona === "komsu" ? templates.neighbourRoute(method, pathname, params) : null)
    ?? database(method, pathname, params)
    ?? studio.route(method, pathname, body, user)
    ?? applicant.route(method, pathname, body, user)
    ?? responses.route(method, pathname, params, body, user)
    ?? templates.route(method, pathname, params, body)
    ?? admin.route(method, pathname, params, body)
    ?? [200, { data: method === "GET" ? null : true }]);

  return {
    ...server,
    control: {
      applicant: applicant.control,
      resetBuild: () => studio.resetBuild(IDS.FB),
      resetShare: () => templates.resetNeighbour(),
      approve: (responseId, note) => responses.route("PATCH", `/api/admin/forms/responses/${responseId}/status`, null, { newStatus: 2, note }, ME),
    },
  };
}
