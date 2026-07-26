import { siteSettings } from "./siteSettings";
import { project } from "./project";
import { post } from "./post";
import { aboutPage } from "./pages/aboutPage";
import { whatWeDoPage } from "./pages/whatWeDoPage";
import { contactPage } from "./pages/contactPage";
import { newsletterPage } from "./pages/newsletterPage";
import { workPage } from "./pages/workPage";
import { insightsPage } from "./pages/insightsPage";

export const schemaTypes = [
  siteSettings, project, post,
  aboutPage, whatWeDoPage, workPage, insightsPage, contactPage, newsletterPage,
];
